import {
	AnyPrimitive,
	ApiException,
	currentTimeMillis,
	Day,
	Dispatcher,
	filterKeys,
	isErrorOfType,
	JwtTools,
	md5,
	MUSTNeverHappenException,
	RecursiveObjectOfPrimitives,
	TypedKeyValue,
	UniqueId
} from '@nu-art/ts-common';
import {firestore} from 'firebase-admin';
import {DBApiConfigV3, ModuleBE_BaseDB} from '@nu-art/thunderstorm/backend/index';
import {DB_Session, DBDef_Session, DBProto_Session} from '../shared/index.js';
import {Header_Authorization, MemKey_DB_Session, MemKey_Jwt, MemKey_SessionData, SessionKey_Account_BE} from './consts.js';
import {MemKey_HttpResponse} from '@nu-art/thunderstorm/backend/modules/server/consts';
import {ResponseHeaderKey_JWTToken} from '@nu-art/thunderstorm';
import {JWT_Handler, ModuleBE_JWT} from './ModuleBE_JWT.js';
import {HttpCodes} from '@nu-art/ts-common/core/exceptions/http-codes';
import Transaction = firestore.Transaction;

export type BaseSessionClaims = {
	accountId: string,
	deviceId: string,
	label: string,
};

export type Props_CreateSession = {
	linkedSessionId?: string
	prevSessions?: UniqueId[]
	initialClaims: BaseSessionClaims
};

export interface CollectSessionData<R extends TypedKeyValue<any, AnyPrimitive>> {
	__collectSessionData(data: BaseSessionClaims, transaction?: Transaction): Promise<R>;
}

export const dispatch_CollectSessionData = new Dispatcher<CollectSessionData<TypedKeyValue<any, RecursiveObjectOfPrimitives>>, '__collectSessionData'>('__collectSessionData');
export const Const_Default_SessionJWT_SecretKey = 'jwt-signer--account-session';

type Config = DBApiConfigV3<DBProto_Session> & {
	sessionTTLms: number
	rotationFactor: number
	maxPrevSession: number
	jwtSigner: {
		secretKey: string
		projectId?: string
	}
}

export class ModuleBE_SessionDB_Class
	extends ModuleBE_BaseDB<DBProto_Session, Config>
	implements CollectSessionData<TypedKeyValue<'session', { deviceId: string }>> {

	private jwtHandler!: JWT_Handler<BaseSessionClaims & RecursiveObjectOfPrimitives>;

	constructor() {
		super(DBDef_Session);
		this.setDefaultConfig({
			sessionTTLms: Day,
			rotationFactor: 0.5,
			maxPrevSession: 10,
			jwtSigner: {
				secretKey: Const_Default_SessionJWT_SecretKey
			}
		});
	}

	init() {
		super.init();
		this.jwtHandler = ModuleBE_JWT.jwtHandler<BaseSessionClaims>({
			label: 'Session-JWT',
			ttlInMs: Day,
			rotationIntervalInMs: 2 * Day,
			...this.config.jwtSigner
		});
	}

	private collectSessionData = async (content: BaseSessionClaims, transaction?: Transaction) => {
		const collectedData = (await dispatch_CollectSessionData.dispatchModuleAsync(content, transaction));
		return collectedData.reduce((sessionData, moduleSessionData) => {
			// We don't skip existing keys. This allows us to override session data provided by infra, with session data provided by app. If wanted, add flag to symbolize this is intentional to all relevant places.
			sessionData[moduleSessionData.key] = moduleSessionData.value;
			return sessionData;
		}, {...content} as RecursiveObjectOfPrimitives & BaseSessionClaims);
	};


	token = {
		create: async (initialClaims: BaseSessionClaims, ttlInMs?: number, transaction?: Transaction) => {
			const claims = await this.collectSessionData(initialClaims, transaction);
			return await this.jwtHandler.create(claims, ttlInMs ?? this.config.sessionTTLms);
		},
		refresh: async (jwtOrigin: string) => {
			const claims = await this.token.verify(jwtOrigin);
			return await this.jwtHandler.create(claims, (claims.exp - claims.iat) * 1000);
		},
		verify: async (jwt: string) => {
			const result = await this.jwtHandler.verifySignature(jwt);
			if (!result.validated)
				throw HttpCodes._4XX.UNAUTHORIZED('JWT received in request is invalid');

			return result.claims;
		}
	};

	private __session = {
		shouldRefresh: async (jwt: string) => {
			// Decode the JWT to retrieve its claims (issued and expiry time).
			const sessionData = await this.jwtHandler.assert(jwt);
			if (SessionKey_Account_BE.get(sessionData).type === 'service') {
				this.logWarning('Cannot refresh session for a service account. This is not allowed.');
				return false;
			}

			// Extract timestamps from the session data.
			const issuedAt = sessionData.iat; // Issued timestamp (in seconds since epoch).
			const expiresAt = sessionData.exp; // Expiry timestamp.

			// Compute total session TTL (in seconds).
			const totalTTL = expiresAt - issuedAt;

			// Compute the remaining time to expiry.
			const remainingTTL = expiresAt - Math.floor(currentTimeMillis() / 1000); // Current time in seconds.

			// Determine if the session should be rotated:
			return remainingTTL / totalTTL < this.config.rotationFactor;
		},
		refresh: async (dbSession: DB_Session = MemKey_DB_Session.get(), transaction?: Transaction) => {
			this.logInfo(`Refreshing JWT for Account: ${dbSession.accountId}`);

			const jwt = await this.token.refresh(dbSession.sessionIdJwt);
			const content: Props_CreateSession = {
				linkedSessionId: dbSession._id,
				prevSessions: dbSession.validSessionJwtMd5s,
				initialClaims: {
					accountId: dbSession.accountId,
					deviceId: dbSession.deviceId,
					label: `refreshed from ${dbSession._id}`,
				}
			};

			return await this._session.save(content, jwt, transaction);
		},
		reissue: async (dbSession: DB_Session = MemKey_DB_Session.get(), transaction?: Transaction) => {
			this.logInfo(`Reissuing JWT for Account: ${dbSession.accountId} from Session: ${dbSession._id}`);
			const claims = await this.token.verify(dbSession.sessionIdJwt);
			const initialClaims = {
				accountId: claims.accountId,
				deviceId: claims.deviceId,
				label: `reissued from ${dbSession._id}`,
			};

			const jwt = await this.token.create(initialClaims, (claims.exp - claims.iat) * 1000, transaction);

			const content: Props_CreateSession = {
				linkedSessionId: dbSession._id,
				prevSessions: dbSession.validSessionJwtMd5s,
				initialClaims: initialClaims
			};
			return await this._session.save(content, jwt, transaction);
		}
	};

	_session = {
		query: {
			byJwt: async (jwt: string, transaction?: Transaction) => {
				return await this.query.uniqueCustom({
					// We use an md5 to save and query for the session object. The original sessionId(JWT) is too big.
					where: {validSessionJwtMd5s: {$ac: md5(jwt)}},
					orderBy: [{key: '__created', order: 'desc'}],
					limit: 1
				}, transaction);
			}
		},
		return: async (dbSession: DB_Session) => {
			const jwt = dbSession.sessionIdJwt;
			MemKey_HttpResponse.get().setHeader(ResponseHeaderKey_JWTToken, jwt);
			MemKey_SessionData.set(await JwtTools.decode(jwt));
			MemKey_Jwt.set(jwt);
			return jwt;
		},
		save: async (content: Props_CreateSession, jwt: string, transaction?: Transaction) => {
			const _id = md5(jwt);
			const validSessionJwtMd5s = content.prevSessions ? [_id, ...content.prevSessions] : [_id];
			if (validSessionJwtMd5s.length > this.config.maxPrevSession)
				validSessionJwtMd5s.length = this.config.maxPrevSession;

			const dbSession = filterKeys({
				_id,
				linkedSessionId: content.linkedSessionId,
				validSessionJwtMd5s: validSessionJwtMd5s,
				accountId: content.initialClaims.accountId,
				deviceId: content.initialClaims.deviceId,
				label: content.initialClaims.label,
				sessionIdJwt: jwt,
			}, ['linkedSessionId', 'label'],);

			return await this.set.item(dbSession, transaction);
		},
		create: Object.assign(async (content: Props_CreateSession, ttlInMs?: number, transaction?: Transaction) => {
				this.logInfo(`Creating JWT for Account: ${content.initialClaims.accountId}`);
				const jwt = await this.token.create(content.initialClaims, ttlInMs, transaction);
				return await this._session.save(content, jwt, transaction);
			},
			{
				andReturn: async (content: Props_CreateSession, ttlInMs?: number, transaction?: Transaction) => {
					const dbSession = await this._session.create(content, ttlInMs, transaction);
					return await this._session.return(dbSession);
				},
			}),
		rotate: {
			refreshIfNeeded: {
				byJwt: async (jwt: string, transaction?: Transaction) => {
					if (!(await this.__session.shouldRefresh(jwt)))
						return;

					const dbSession = await this._session.query.byJwt(jwt, transaction);
					this.logInfo(`Refreshing Session by JWT for account(${dbSession.accountId}) sessionId(${dbSession._id})`);
					return await this.__session.refresh(dbSession, transaction);
				},
				bySession: async (dbSession: DB_Session = MemKey_DB_Session.get(), transaction?: Transaction) => {
					if (!(await this.__session.shouldRefresh(dbSession.sessionIdJwt)))
						return dbSession;

					this.logInfo(`Refreshing Session by dbSession for account(${dbSession.accountId}) sessionId(${dbSession._id})`);
					return await this.__session.refresh(dbSession, transaction);
				}
			},
			reissue: {
				byJwt: async (jwt: string, transaction?: Transaction) => {
					await this.jwtHandler.assert(jwt);
					const dbSession = await this._session.query.byJwt(jwt, transaction);
					return await this.__session.reissue(dbSession, transaction);
				},
				bySession: async (dbSession: DB_Session = MemKey_DB_Session.get(), transaction?: Transaction) => {
					await this.jwtHandler.assert(dbSession.sessionIdJwt);
					return await this.__session.reissue(dbSession, transaction);
				}
			}
		},
		invalidate: {
			byJwt: async (jwt: string, transaction?: Transaction) => {
				const session = await this._session.query.byJwt(jwt, transaction);
				return await this._session.invalidate.bySession(session, transaction);
			},
			bySession: async (dbSession: DB_Session = MemKey_DB_Session.get(), transaction?: Transaction) => {
				if (!dbSession)
					throw HttpCodes._4XX.UNAUTHORIZED('No session in context to invalidate');

				await this.set.item({...dbSession, validSessionJwtMd5s: []}, transaction);

				this.logInfo(`Session invalidated for account: ${dbSession.accountId}, sessionId: ${dbSession._id}`);
			}
		}
	};


	readonly Middleware = async () => {
		const jwt = Header_Authorization.get(); //jwt

		const validationResult = await this.jwtHandler.verifySignature(jwt);
		if (!validationResult.validated)
			throw HttpCodes._4XX.FORBIDDEN('JWT received in request is invalid');

		try {

			const {dbSession, claims} = await this.runTransaction(async t => {
				let dbSession = await this._session.query.byJwt(jwt);
				const latestJwtValidationResult = await this.jwtHandler.verifySignature(dbSession.sessionIdJwt);
				if (!latestJwtValidationResult.validated)
					throw new MUSTNeverHappenException(`JWT received from DB is invalid Session id = ${dbSession._id}`);

				dbSession = await this._session.rotate.refreshIfNeeded.bySession(dbSession);
				return {dbSession, claims: latestJwtValidationResult.claims};
			});

			MemKey_DB_Session.set(dbSession);
			MemKey_SessionData.set(claims);
			MemKey_Jwt.set(dbSession.sessionIdJwt);

			MemKey_HttpResponse.get().setHeader(ResponseHeaderKey_JWTToken, dbSession.sessionIdJwt);

		} catch (err: any) {
			if (isErrorOfType(err, ApiException))
				throw err;

			this.logErrorBold(jwt);
			throw HttpCodes._4XX.UNAUTHORIZED('JWT received in request is invalid', err);
		}
	};

	async __collectSessionData(data: BaseSessionClaims) {
		return {
			key: 'session' as const,
			value: {
				deviceId: data.deviceId,
			}
		};
	}
};

export const ModuleBE_SessionDB = new ModuleBE_SessionDB_Class();