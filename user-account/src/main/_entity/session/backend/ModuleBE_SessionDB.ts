import {__stringify, ApiException, batchActionParallel, currentTimeMillis, Day, Dispatcher, filterKeys, md5, TS_Object, TypedKeyValue} from '@nu-art/ts-common';
import {gzipSync, unzipSync} from 'zlib';
import {firestore} from 'firebase-admin';
import {DBApiConfigV3, ModuleBE_BaseDB, Storm} from '@nu-art/thunderstorm/backend';
import {_SessionKey_Session, DB_Session, DBDef_Session, DBProto_Session} from '../shared';
import {Header_SessionId, MemKey_AccountId, MemKey_SessionData, MemKey_SessionObject, SessionKey_Account_BE, SessionKey_Session_BE} from './consts';
import * as jwt from 'jsonwebtoken';
import {ModuleBE_SecretManager} from '@nu-art/google-services/backend/modules/ModuleBE_SecretManager';
import {HttpCodes} from '@nu-art/ts-common/core/exceptions/http-codes';
import {MemKey_HttpResponse} from '@nu-art/thunderstorm/backend/modules/server/consts';
import {HeaderKey_SessionId} from '@nu-art/thunderstorm';
import Transaction = firestore.Transaction;


export type SessionCollectionParam = { accountId: string, deviceId: string };

export interface CollectSessionData<R extends TypedKeyValue<any, any>> {
	__collectSessionData(data: SessionCollectionParam, transaction?: Transaction): Promise<R>;
}

export const dispatch_CollectSessionData = new Dispatcher<CollectSessionData<TypedKeyValue<any, any>>, '__collectSessionData'>('__collectSessionData');
export const Const_Default_AccountSessionId_SecretName = 'account-session-id-signer';

type Config = DBApiConfigV3<DBProto_Session> & {
	sessionTTLms: number
	rotationFactor: number
	accountSessionIdSigner_SecretName: string
}

type PreDBSessionContent = { accountId: string, deviceId: string, prevSession?: string[], label: string, ttl?: number };

export class ModuleBE_SessionDB_Class
	extends ModuleBE_BaseDB<DBProto_Session, Config>
	implements CollectSessionData<_SessionKey_Session> {

	private sessionSigningPrivateKey: string | undefined;

	readonly Middleware = async () => {
		const sessionIdFromRequest = Header_SessionId.get(); //jwt
		if (typeof sessionIdFromRequest !== 'string')
			throw new ApiException(401, `Invalid session id: ${sessionIdFromRequest}`);

		try {
			const decodedJwt = await this.sessionData.isValidJWT(sessionIdFromRequest) as { sessionData: string };
			const sessionData = this.sessionData.decode(decodedJwt.sessionData);


			//Get the existing dbSession for this sessionIdFromRequest, there is one, even in previousSessions
			const md5SessionId = md5(sessionIdFromRequest); // We use an md5 to save and query for the session object. The original sessionId(JWT) is too big.
			const dbSession = await this.runTransaction(async transaction => {
				// If we find the dbSession - this means that the JWT was not modified, as we managed to find a md5 matching sessionId.
				// This is how we verify the JWT was not tampered!!!!!!!!!
				let dbSession;
				try {
					dbSession = await ModuleBE_SessionDB.query.uniqueWhere({sessionId: md5SessionId}, transaction);
				} catch (err: any) {
					try {
						dbSession = await ModuleBE_SessionDB.query.uniqueWhere({prevSession: {$ac: md5SessionId}}, transaction); //everytime we read into prevSessions, we read the md5 of the sessionIdFromRequest
						MemKey_HttpResponse.get().setHeader(HeaderKey_SessionId, dbSession.sessionIdJwt);
					} catch (err: any) {
						throw new ApiException(401, `Invalid session id: ${sessionIdFromRequest}`, err);
					}
				}
				return dbSession;
			});

			MemKey_SessionObject.set(dbSession);
			this.sessionData.setToMemKey(sessionData);
		} catch (err: any) {
			this.logErrorBold(sessionIdFromRequest);
			throw HttpCodes._4XX.UNAUTHORIZED('JWT received in request is invalid', err);
		}
	};

	constructor() {
		super(DBDef_Session);
		this.setDefaultConfig({
			sessionTTLms: Day,
			rotationFactor: 0.5,
			accountSessionIdSigner_SecretName: Const_Default_AccountSessionId_SecretName
		});
	}

	async __collectSessionData(data: SessionCollectionParam) {
		const now = currentTimeMillis();
		return {
			key: 'session' as const,
			value: {
				deviceId: data.deviceId,
				timestamp: now,
				expiration: now + this.config.sessionTTLms,
			}
		};
	}

	private getPrivateKeyForSessionSigning = async (): Promise<string> => {
		if (Storm.getInstance().getEnvironment() === 'local')
			this.sessionSigningPrivateKey = 'f29a755ba5caaa2713cfa95adff14ca5f9fa8de3345141d426209f69660a5013'; // Local's private key for JWT signing
		else
			this.sessionSigningPrivateKey = await ModuleBE_SecretManager.getSecret(this.config.accountSessionIdSigner_SecretName);

		return this.sessionSigningPrivateKey;
	};

	private sessionData = {
		encode: async (sessionData: TS_Object) => gzipSync(Buffer.from(__stringify(sessionData), 'utf8')).toString('base64'),
		decode: (sessionId: string): TS_Object => JSON.parse((unzipSync(Buffer.from(sessionId, 'base64'))).toString('utf8')),
		decodeJWT: (jwtString: string): TS_Object => this.sessionData.decode((jwt.decode(jwtString) as {
			sessionData: string
		}).sessionData),
		collect: async (content: PreDBSessionContent, manipulate?: (sessionData: TS_Object) => TS_Object, transaction?: Transaction) => {
			const collectedData = (await dispatch_CollectSessionData.dispatchModuleAsync(content, transaction));
			let sessionData = collectedData.reduce((sessionData: TS_Object, moduleSessionData) => {
				sessionData[moduleSessionData.key] = moduleSessionData.value; // We don't skip existing keys. This allows us to override session data provided by infra, with session data provided by app. If wanted, add flag to symbolize this is intentional to all relevant places.
				return sessionData;
			}, {});

			sessionData = manipulate?.(sessionData) ?? sessionData;
			const encodedSessionData = await this.sessionData.encode(sessionData);
			return {encoded: encodedSessionData, raw: sessionData};
		},
		setToMemKey: (sessionData: TS_Object) => MemKey_SessionData.set(sessionData),
		createJWT: async (sessionData: any, expiry: number) => {
			const payload = {sessionData: typeof sessionData === 'string' ? sessionData : JSON.stringify(sessionData)};
			const privateKey = await this.getPrivateKeyForSessionSigning();
			const options = {expiresIn: Math.floor(expiry / 1000)};

			try {
				return jwt.sign(payload, privateKey, options);
			} catch (e: any) {
				this.logWarning('Error signing token', e);
				throw e;
			}
		},
		isValidJWT: async (stringJWT: string) => { // returns the decoded JWT
			return jwt.verify(stringJWT, await this.getPrivateKeyForSessionSigning());
		}
	};

	session = {
		create: async (content: PreDBSessionContent, transaction?: Transaction) => {
			return this.session.createCustom(content, d => d, transaction);
		},
		createCustom: async (content: PreDBSessionContent, manipulate: (sessionData: TS_Object) => TS_Object, transaction?: Transaction) => {
			const sessionData = await this.sessionData.collect(content, manipulate, transaction);
			const JWTExpiry = content.ttl ?? this.config.sessionTTLms;
			const jwt = await this.sessionData.createJWT(sessionData.encoded, JWTExpiry);

			const session = filterKeys({
				accountId: content.accountId,
				deviceId: content.deviceId,
				prevSession: content.prevSession ?? [],
				label: content.label,
				sessionId: md5(jwt), // The sessionId JWT string is way to long to query by. We save an md5(32 chars) instead in sessionId and previousSessions.
				sessionIdJwt: jwt,
				timestamp: currentTimeMillis(),
			}, ['prevSession', 'label'],);

			await this.set.item(session, transaction);
			return {sessionId: jwt, sessionData: sessionData.raw};
		},
		isExpirationValid: (sessionData?: TS_Object) => {
			const expiration = SessionKey_Session_BE.get(sessionData).expiration;
			const now = currentTimeMillis();
			return expiration > now;
		},
		canRotate: (createdAt: number, sessionData?: TS_Object) => {
			if (SessionKey_Account_BE.get(sessionData).type === 'service')
				return false;

			const expiration = SessionKey_Session_BE.get(sessionData).expiration;
			const renewSessionTTL = (expiration - createdAt) * this.config.rotationFactor;

			const now = currentTimeMillis();
			return expiration - renewSessionTTL < now;
		},
		invalidate: async (_accountIds: string[] = [MemKey_AccountId.get()]): Promise<void> => {
			if (_accountIds.length > 0) {
				const sessions = await batchActionParallel(_accountIds, 10, async ids => await this.query.custom({where: {accountId: {$in: ids}}}));

				const newSessions = (await this.runTransaction(t => {
					return Promise.all(sessions.map(async session => {
						return this.session.rotate(session, t);
					}));
				}));

				const mySession = newSessions.find(session => SessionKey_Account_BE.get(session?.sessionData)._id === MemKey_AccountId.get());
				if (mySession) {
					MemKey_HttpResponse.get().setHeader(HeaderKey_SessionId, mySession.sessionId);
				}
			}
		},
		delete: async (transaction?: Transaction) => {
			const sessionId = Header_SessionId.get();
			if (!sessionId)
				throw new ApiException(404, 'Missing sessionId');

			await this.delete.query({where: {sessionId: md5(sessionId)}}, transaction);
		},
		rotate: async (dbSession: DB_Session = MemKey_SessionObject.get(), transaction?: Transaction) => {
			this.logInfo(`Rotating sessionId for Account: ${dbSession.accountId}`);
			const content: PreDBSessionContent = {
				accountId: dbSession.accountId,
				deviceId: dbSession.deviceId,
				prevSession: [md5(dbSession.sessionIdJwt), ...(dbSession.prevSession || [])], // MD5 converts any string into a 32 hash. This is to be used as an identifier since the sessionId/JWT string is waaay too long.
				label: 'user-auth-session'
			};

			if (SessionKey_Account_BE.get(this.sessionData.decodeJWT(dbSession.sessionIdJwt)).type === 'service') {
				const decodedJwt = jwt.decode(dbSession.sessionIdJwt) as { exp: number };
				content.ttl = (decodedJwt.exp * 1000) - currentTimeMillis(); // jwt expiry is in seconds, and we usually work in milliseconds so this is required to keep consistency
			}

			return await this.session.create(content, transaction);
		},
		isExpired: (session: DB_Session) => {
			const decodedJwt = this.sessionData.decodeJWT(session.sessionIdJwt);
			return currentTimeMillis() >= decodedJwt.session.expiration;
		}
	};
}

export const ModuleBE_SessionDB = new ModuleBE_SessionDB_Class();