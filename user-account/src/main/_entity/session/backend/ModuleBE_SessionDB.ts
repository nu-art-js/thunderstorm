import {
	ApiException,
	batchActionParallel,
	currentTimeMillis,
	Day,
	Dispatcher,
	exists,
	filterInstances,
	filterKeys,
	md5,
	RecursiveObjectOfPrimitives,
	TS_Object,
	TypedKeyValue
} from '@nu-art/ts-common';
import {firestore} from 'firebase-admin';
import {DBApiConfigV3, HeaderKey, ModuleBE_BaseDB} from '@nu-art/thunderstorm/backend';
import {_SessionKey_Session, DB_Session, DBDef_Session, DBProto_Session} from '../shared';
import {Header_Authorization, MemKey_AccountId, MemKey_SessionData, MemKey_SessionObject, SessionKey_Account_BE, SessionKey_Session_BE} from './consts';
import {HttpCodes} from '@nu-art/ts-common/core/exceptions/http-codes';
import {MemKey_HttpResponse} from '@nu-art/thunderstorm/backend/modules/server/consts';
import {ResponseHeaderKey_JWTToken} from '@nu-art/thunderstorm';
import {JWT_Handler, ModuleBE_JWT} from './ModuleBE_JWT';
import Transaction = firestore.Transaction;


export type SessionCollectionParam = { accountId: string, deviceId: string };

export interface CollectSessionData<R extends TypedKeyValue<any, any>> {
	__collectSessionData(data: SessionCollectionParam, transaction?: Transaction): Promise<R>;
}

export const dispatch_CollectSessionData = new Dispatcher<CollectSessionData<TypedKeyValue<any, any>>, '__collectSessionData'>('__collectSessionData');
export const Const_Default_SessionJWT_SecretKey = 'jwt-signer--account-session';

type Config = DBApiConfigV3<DBProto_Session> & {
	sessionTTLms: number
	rotationFactor: number
	jwtSigner: {
		secretKey: string
		projectId?: string
	}
}

type PreDBSessionContent = { accountId: string, deviceId: string, prevSession?: string[], label: string, ttl?: number };

export class ModuleBE_SessionDB_Class
	extends ModuleBE_BaseDB<DBProto_Session, Config>
	implements CollectSessionData<_SessionKey_Session> {

	private jwtHandler!: JWT_Handler<RecursiveObjectOfPrimitives>;

	readonly Middleware = async () => {
		let authorizationHeader: string;
		try {
			authorizationHeader = new HeaderKey('x-session-id', 403).get();
		} catch (e) {
			authorizationHeader = Header_Authorization.get(); //jwt
			if (typeof authorizationHeader !== 'string')
				throw new ApiException(401, `Invalid session id: ${authorizationHeader}`);

			authorizationHeader = authorizationHeader.replace(/^bearer\s+/i, '');
		}

		try {
			const sessionData = await this.jwtHandler.verifySignature(authorizationHeader);

			//Get the existing dbSession for this authorizationHeader, there is one, even in previousSessions
			const md5SessionId = md5(authorizationHeader); // We use an md5 to save and query for the session object. The original sessionId(JWT) is too big.
			const dbSession = await this.runTransaction(async transaction => {
				// If we find the dbSession - this means that the JWT was not modified, as we managed to find a md5 matching sessionId.
				// This is how we verify the JWT was not tampered!!!!!!!!!
				let dbSession;
				try {
					dbSession = await ModuleBE_SessionDB.query.uniqueWhere({sessionId: md5SessionId}, transaction);
				} catch (err: any) {
					try {
						dbSession = await ModuleBE_SessionDB.query.uniqueWhere({prevSession: {$ac: md5SessionId}}, transaction); //everytime we read into prevSessions, we read the md5 of the authorizationHeader
						MemKey_HttpResponse.get().setHeader(ResponseHeaderKey_JWTToken, dbSession.sessionIdJwt);
					} catch (err: any) {
						throw new ApiException(401, `Invalid session id: ${authorizationHeader}`, err);
					}
				}
				return dbSession;
			});

			MemKey_SessionObject.set(dbSession);
			this.sessionData.setToMemKey(sessionData);
		} catch (err: any) {
			this.logErrorBold(authorizationHeader);
			throw HttpCodes._4XX.UNAUTHORIZED('JWT received in request is invalid', err);
		}
	};

	constructor() {
		super(DBDef_Session);
		this.setDefaultConfig({
			sessionTTLms: Day,
			rotationFactor: 0.5,
			jwtSigner: {
				secretKey: Const_Default_SessionJWT_SecretKey
			}
		});
	}

	init() {
		super.init();
		this.jwtHandler = ModuleBE_JWT.jwtHandler<PreDBSessionContent>({
			label: 'Session-JWT',
			ttl: Day,
			rotationTTL: 2 * Day,
			...this.config.jwtSigner
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

	private sessionData = {
		collect: async (content: PreDBSessionContent, manipulate?: (sessionData: TS_Object) => TS_Object, transaction?: Transaction) => {
			const collectedData = (await dispatch_CollectSessionData.dispatchModuleAsync(content, transaction));
			let sessionData = collectedData.reduce((sessionData: TS_Object, moduleSessionData) => {
				sessionData[moduleSessionData.key] = moduleSessionData.value; // We don't skip existing keys. This allows us to override session data provided by infra, with session data provided by app. If wanted, add flag to symbolize this is intentional to all relevant places.
				return sessionData;
			}, {});

			return manipulate?.(sessionData) ?? sessionData;
		},
		setToMemKey: (sessionData: TS_Object) => MemKey_SessionData.set(sessionData),
	};

	session = {
		create: async (content: PreDBSessionContent, transaction?: Transaction) => {
			return this.session.createCustom(content, d => d, transaction);
		},
		createCustom: async (content: PreDBSessionContent, manipulate: (sessionData: TS_Object) => TS_Object, transaction?: Transaction) => {
			const sessionData = await this.sessionData.collect(content, manipulate, transaction);

			const jwt = await this.jwtHandler.create(sessionData, content.ttl ?? this.config.sessionTTLms);

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
		isExpired: async (sessionJwt: string) => {
			return await this.jwtHandler.isExpired(sessionJwt);
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

				const newSessions = filterInstances(await this.runTransaction(t => {
					return Promise.all(sessions.map(async session => {
						return this.session.rotate(session, t);
					}));
				}));

				const mySession = newSessions.find(session => SessionKey_Account_BE.get(session?.sessionData)._id === MemKey_AccountId.get());
				if (mySession) {
					MemKey_HttpResponse.get().setHeader(ResponseHeaderKey_JWTToken, mySession.sessionId);
				}
			}
		},
		delete: async (transaction?: Transaction) => {
			const sessionId = Header_Authorization.get();
			if (!sessionId)
				throw new ApiException(404, 'Missing sessionId');

			await this.delete.query({where: {sessionId: md5(sessionId)}}, transaction);
		},
		rotate: async (dbSession: DB_Session = MemKey_SessionObject.get(), transaction?: Transaction) => {
			this.logInfo(`Rotating sessionId for Account: ${dbSession.accountId}`);

			if (!exists(dbSession.sessionIdJwt))
				return;

			if (!exists(dbSession.deviceId))
				return;

			const content: PreDBSessionContent = {
				accountId: dbSession.accountId,
				deviceId: dbSession.deviceId,
				prevSession: [md5(dbSession.sessionIdJwt), ...(dbSession.prevSession || [])], // MD5 converts any string into a 32 hash. This is to be used as an identifier since the sessionId/JWT string is waaay too long.
				label: 'user-auth-session'
			};

			if (exists(dbSession.sessionIdJwt)) {
				const sessionData = await this.jwtHandler.verifySignature(dbSession.sessionIdJwt);
				if (SessionKey_Account_BE.get(sessionData).type === 'service') {
					const decodedJwt = sessionData as { exp: number };
					content.ttl = (decodedJwt.exp * 1000) - currentTimeMillis(); // jwt expiry is in seconds, and we usually work in milliseconds so this is required to keep consistency
				}
			}

			return await this.session.create(content, transaction);
		},
	};
}

export const ModuleBE_SessionDB = new ModuleBE_SessionDB_Class();