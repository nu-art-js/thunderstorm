import {
	AnyPrimitive,
	ApiException,
	currentTimeMillis,
	Day,
	Dispatcher,
	filterKeys,
	isErrorOfType,
	JwtTools,
	MUSTNeverHappenException,
	RecursiveObjectOfPrimitives,
	TypedKeyValue,
	TypedMap
} from '@nu-art/ts-common';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {AccountType_Service, DatabaseDef_Account, DatabaseDef_Session, DB_Account, DB_Session, DBDef_Session} from '@nu-art/user-account-shared';
import {Header_Authorization, MemKey_DB_Session, MemKey_Jwt, MemKey_SessionData, SessionKey_Account_BE} from './consts.js';
import {MemKey_HttpResponse} from '@nu-art/http-server';
import {JWT_Handler, ModuleBE_JWT} from './ModuleBE_JWT.js';
import {HttpCodes} from '@nu-art/api-types';
import {_EmptyQuery} from '@nu-art/firebase-shared';
import {ModuleBE_AccountDB, OnAccountDeleted} from '../account/ModuleBE_AccountDB.js';
import {ResponseHeaderKey_JWTToken} from '@nu-art/api-types';
import {dbObjectToId, hashToUniqueId} from '@nu-art/db-api-shared';

export type BaseSessionClaims = {
	accountId: DatabaseDef_Account['id'],
	deviceId: string,
	label: string,
};

export type Props_CreateSession = {
	linkedSessionId?: DatabaseDef_Session['id']
	prevSessions?: DatabaseDef_Session['id'][]
	initialClaims: BaseSessionClaims
};

export interface CollectSessionData<R extends TypedKeyValue<any, AnyPrimitive>> {
	__collectSessionData(data: BaseSessionClaims): Promise<R>;
}

export const dispatch_CollectSessionData = new Dispatcher<CollectSessionData<TypedKeyValue<any, RecursiveObjectOfPrimitives>>, '__collectSessionData'>('__collectSessionData');
export const Const_Default_SessionJWT_SecretKey = 'jwt-signer--account-session';

type Config = {
	sessionTTLms: number
	rotationFactor: number
	maxPrevSession: number
	jwtSigner: {
		secretKey: string
		projectId?: string
	}
}

export class ModuleBE_SessionDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_Session, Config>
	implements CollectSessionData<TypedKeyValue<'session', { deviceId: string }>>, OnAccountDeleted {

	private jwtHandler!: JWT_Handler<BaseSessionClaims & RecursiveObjectOfPrimitives>;

	__onAccountDeleted = async (account: DB_Account) => {
		await this.delete.where({accountId: account._id});
	};

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

	private collectSessionData = async (content: BaseSessionClaims) => {
		const collectedData = (await dispatch_CollectSessionData.dispatchModuleAsync(content));
		return collectedData.reduce((sessionData, moduleSessionData) => {
			// We don't skip existing keys. This allows us to override session data provided by infra, with session data provided by app. If wanted, add flag to symbolize this is intentional to all relevant places.
			sessionData[moduleSessionData.key] = moduleSessionData.value;
			return sessionData;
		}, {...content} as RecursiveObjectOfPrimitives & BaseSessionClaims);
	};

	preWriteProcessing = async (instance: DatabaseDef_Session['dbType']) => {
		if ('sessionId' in instance)
			delete instance.sessionId;
		if ('timestamp' in instance)
			delete instance.timestamp;
		if ('prevSession' in instance)
			delete instance.prevSession;
	};


	token = {
		create: async (initialClaims: BaseSessionClaims, ttlInMs?: number) => {
			const claims = await this.collectSessionData(initialClaims);
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
		refresh: async (dbSession: DB_Session = MemKey_DB_Session.get()) => {
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

			return await this._session.save(content, jwt);
		},
		reissue: async (dbSession: DB_Session = MemKey_DB_Session.get()) => {
			this.logInfo(`Reissuing JWT for Account: ${dbSession.accountId} from Session: ${dbSession._id}`);
			const claims = await this.token.verify(dbSession.sessionIdJwt);
			const initialClaims = {
				accountId: claims.accountId,
				deviceId: claims.deviceId,
				label: `reissued from ${dbSession._id}`,
			};

			const jwt = await this.token.create(initialClaims, (claims.exp - claims.iat) * 1000);

			const content: Props_CreateSession = {
				linkedSessionId: dbSession._id,
				prevSessions: dbSession.validSessionJwtMd5s,
				initialClaims: initialClaims
			};
			return await this._session.save(content, jwt);
		}
	};

	_session = {
		query: {
			byJwt: async (jwt: string) => {
				return await this.query.uniqueCustom({
					// We use an md5 to save and query for the session object. The original sessionId(JWT) is too big.
					where: {validSessionJwtMd5s: {$ac: hashToUniqueId<DatabaseDef_Session['dbKey']>(jwt)}},
					orderBy: [{key: '__created', order: 'desc'}],
					limit: 1
				});
			}
		},
		return: async (dbSession: DB_Session) => {
			const jwt = dbSession.sessionIdJwt;
			MemKey_HttpResponse.get().setHeader(ResponseHeaderKey_JWTToken, jwt);
			MemKey_SessionData.set(await JwtTools.decode(jwt));
			MemKey_Jwt.set(jwt);
			return jwt;
		},
		save: async (content: Props_CreateSession, jwt: string) => {
			const _id = hashToUniqueId<DatabaseDef_Session['dbKey']>(jwt);
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

			const idsToDelete = dbSession.validSessionJwtMd5s.slice(1);
			if (idsToDelete.length)
				await this.delete.all(idsToDelete);

			return await this.set.item(dbSession);
		},
		create: Object.assign(async (content: Props_CreateSession, ttlInMs?: number) => {
				this.logInfo(`Creating JWT for Account: ${content.initialClaims.accountId}`);
				const jwt = await this.token.create(content.initialClaims, ttlInMs);
				return await this._session.save(content, jwt);
			},
			{
				andReturn: async (content: Props_CreateSession, ttlInMs?: number) => {
					const dbSession = await this._session.create(content, ttlInMs);
					return await this._session.return(dbSession);
				},
			}),
		rotate: {
			refreshIfNeeded: {
				byJwt: async (jwt: string) => {
					if (!(await this.__session.shouldRefresh(jwt)))
						return;

					const dbSession = await this._session.query.byJwt(jwt);
					this.logInfo(`Refreshing Session by JWT for account(${dbSession.accountId}) sessionId(${dbSession._id})`);
					return await this.__session.refresh(dbSession);
				},
				bySession: async (dbSession: DB_Session = MemKey_DB_Session.get()) => {
					if (!(await this.__session.shouldRefresh(dbSession.sessionIdJwt)))
						return dbSession;

					this.logInfo(`Refreshing Session by dbSession for account(${dbSession.accountId}) sessionId(${dbSession._id})`);
					return await this.__session.refresh(dbSession);
				}
			},
			reissue: {
				byJwt: async (jwt: string) => {
					await this.jwtHandler.assert(jwt);
					const dbSession = await this._session.query.byJwt(jwt);
					return await this.__session.reissue(dbSession);
				},
				bySession: async (dbSession: DB_Session = MemKey_DB_Session.get()) => {
					await this.jwtHandler.assert(dbSession.sessionIdJwt);
					return await this.__session.reissue(dbSession);
				}
			}
		},
		invalidate: {
			byJwt: async (jwt: string) => {
				const session = await this._session.query.byJwt(jwt);
				return await this._session.invalidate.bySession(session);
			},
			bySession: async (dbSession: DB_Session = MemKey_DB_Session.get()) => {
				if (!dbSession)
					throw HttpCodes._4XX.UNAUTHORIZED('No session in context to invalidate');

				await this.set.item({...dbSession, validSessionJwtMd5s: []});

				this.logInfo(`Session invalidated for account: ${dbSession.accountId}, sessionId: ${dbSession._id}`);
			}
		}
	};


	readonly Middleware = async () => {
		const jwt = Header_Authorization.get(); //jwt

		const expired = await this.jwtHandler.isExpired(jwt);
		if (expired)
			throw HttpCodes._4XX.UNAUTHORIZED('JWT received in request is expired');

		const validationResult = await this.jwtHandler.verifySignature(jwt);
		if (!validationResult.validated)
			throw HttpCodes._4XX.FORBIDDEN('JWT received in request is invalid');

		await this.locateSession(jwt);
	};

	private async locateSession(jwt: string) {
		try {
			const {dbSession, claims} = await this.runTransaction(async () => {
				let dbSession: DB_Session;
				try {
					dbSession = await this._session.query.byJwt(jwt);
				} catch (err: any) {
					if (isErrorOfType(err, ApiException)?.responseCode === HttpCodes._4XX.NOT_FOUND.code)
						throw HttpCodes._4XX.UNAUTHORIZED('JWT received in request was not found', err);

					throw err;
				}
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
	}

	async __collectSessionData(data: BaseSessionClaims) {
		return {
			key: 'session' as const,
			value: {
				deviceId: data.deviceId,
			}
		};
	}

	public cleanOldOrExpiredSessions = async () => {
		const sessions = await this.query.custom(_EmptyQuery);
		const accounts = await ModuleBE_AccountDB.query.where({type: {$neq: AccountType_Service}});
		const validAccountIds = new Set(accounts.map(dbObjectToId));
		const sessionIdsToDelete = new Set<DatabaseDef_Session['dbType']['_id']>();
		const accountSessionMap: TypedMap<DB_Session> = {};
		this.logWarning(`#### Cleaning ${sessions.length} sessions for ${validAccountIds.size} accounts ####`);
		//First pass - Collect all sessions that are referenced by newer sessions
		sessions.forEach(session => {
			if (validAccountIds.has(session.accountId)) {
				const currentSession = accountSessionMap[session.accountId];
				if (!currentSession || currentSession.__created < session.__created) {
					accountSessionMap[session.accountId] = session;
					if (currentSession)
						sessionIdsToDelete.add(currentSession._id);
				} else {
					sessionIdsToDelete.add(session._id);
				}
			}
			if (!session.validSessionJwtMd5s?.length)
				sessionIdsToDelete.add(session._id);
			else
				session.validSessionJwtMd5s.forEach(id => {
					if (id !== session._id)
						sessionIdsToDelete.add(id);
				});
		});

		//Second pass - collect all sessions that are expired or has the old "sessionData" property in their decoded data
		await Promise.all(sessions.map(async session => {
			if (sessionIdsToDelete.has(session._id))
				return;

			const isExpired = await JwtTools.isJwtExpired(session.sessionIdJwt);
			if (isExpired)
				return sessionIdsToDelete.add(session._id);

			const decoded = await JwtTools.decode(session.sessionIdJwt);
			if ('sessionData' in decoded)
				return sessionIdsToDelete.add(session._id);
		}));

		//Delete sessions
		const ids = Array.from(sessionIdsToDelete);
		await this.delete.all(ids);
		this.logWarning(`### Deleted ${sessionIdsToDelete.size} Sessions! ###`);
	};
}

export const ModuleBE_SessionDB = new ModuleBE_SessionDB_Class();