import {__stringify, ApiException, batchActionParallel, currentTimeMillis, Day, Dispatcher, filterKeys, TS_Object, TypedKeyValue} from '@nu-art/ts-common';
import {gzipSync, unzipSync} from 'zlib';
import {firestore} from 'firebase-admin';
import {_SessionKey_Session, DB_Session, DBDef_Session, DBProto_Session, HeaderKey_SessionId} from '../../shared';
import {Header_SessionId, MemKey_AccountId, MemKey_SessionData, MemKey_SessionObject, SessionKey_Session_BE} from '../core/consts';
import {DBApiConfigV3, ModuleBE_BaseDBV3} from '@nu-art/thunderstorm/backend';
import {MemKey_HttpResponse} from '@nu-art/thunderstorm/backend/modules/server/consts';
import Transaction = firestore.Transaction;


export type SessionCollectionParam = { accountId: string, deviceId: string };

export interface CollectSessionData<R extends TypedKeyValue<any, any>> {
	__collectSessionData(data: SessionCollectionParam, transaction?: Transaction): Promise<R>;
}

export const dispatch_CollectSessionData = new Dispatcher<CollectSessionData<TypedKeyValue<any, any>>, '__collectSessionData'>('__collectSessionData');

type Config = DBApiConfigV3<DBProto_Session> & {
	sessionTTLms: number
	rotationFactor: number
}

type PreDBSessionContent = { accountId: string, deviceId: string, prevSession?: string[], label: string };

export class ModuleBE_SessionDB_Class
	extends ModuleBE_BaseDBV3<DBProto_Session, Config>
	implements CollectSessionData<_SessionKey_Session> {

	readonly ServiceAccount_Middleware = async (sessionId: string) => {
		const sessionData = this.sessionData.decode(sessionId);
		if (!this.session.isValid(sessionData))
			throw new ApiException(401, 'Session timed out');

		MemKey_SessionData.set(sessionData);
	};

	readonly Middleware = async () => {
		const sessionId = Header_SessionId.get();
		if (typeof sessionId !== 'string')
			throw new ApiException(401, `Invalid session id: ${sessionId}`);

		const dbSession = await this.runTransaction(async transaction => {
			let dbSession;
			try {
				dbSession = await ModuleBE_SessionDB.query.uniqueWhere({sessionId}, transaction);
			} catch (err: any) {
				try {
					dbSession = await ModuleBE_SessionDB.query.uniqueWhere({prevSession: {$ac: sessionId}}, transaction);
				} catch (err: any) {
					throw new ApiException(401, `Invalid session id: ${sessionId}`, err);
				}
			}
			return dbSession;
		});

		MemKey_SessionObject.set(dbSession);
		let sessionData = this.sessionData.decode(sessionId);
		if (!this.session.isValid(sessionData))
			throw new ApiException(401, 'Session timed out');

		if (dbSession.needToRefresh || this.session.canRotate(dbSession.timestamp, sessionData)) {
			sessionData = await this.session.rotate(dbSession);
		}

		MemKey_SessionData.set(sessionData);
	};

	constructor() {
		super(DBDef_Session);
		this.setDefaultConfig({sessionTTLms: Day, rotationFactor: 0.5});
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
		encode: async (sessionData: TS_Object) => gzipSync(Buffer.from(__stringify(sessionData), 'utf8')).toString('base64'),
		decode: (sessionId: string): TS_Object => JSON.parse((unzipSync(Buffer.from(sessionId, 'base64'))).toString('utf8')),
		collect: async (content: PreDBSessionContent, manipulate?: (sessionData: TS_Object) => TS_Object, transaction?: Transaction) => {
			const collectedData = (await dispatch_CollectSessionData.dispatchModuleAsync(content, transaction));
			let sessionData = collectedData.reduce((sessionData: TS_Object, moduleSessionData) => {
				sessionData[moduleSessionData.key] = moduleSessionData.value;
				return sessionData;
			}, {});

			sessionData = manipulate?.(sessionData) ?? sessionData;
			const encodedSessionData = await this.sessionData.encode(sessionData);
			return {encoded: encodedSessionData, raw: sessionData};
		},
		setToMemKey: (sessionData: TS_Object) => MemKey_SessionData.set(sessionData),
	};

	session = {
		create: async (content: PreDBSessionContent, transaction?: Transaction) => {
			return this.session.createCustom(content, d => d, transaction);
		},
		createCustom: async (content: PreDBSessionContent, manipulate: (sessionData: TS_Object) => TS_Object, transaction?: Transaction) => {
			const sessionData = await this.sessionData.collect(content, manipulate, transaction);
			const session = filterKeys({
				accountId: content.accountId,
				deviceId: content.deviceId,
				prevSession: content.prevSession ?? [],
				label: content.label,
				sessionId: sessionData.encoded,
				timestamp: currentTimeMillis()
			}, ['prevSession', 'label'],);

			await this.set.item(session, transaction);
			return {sessionId: sessionData.encoded, sessionData: sessionData.raw};
		},
		isValid: (sessionData?: TS_Object) => {
			const expiration = SessionKey_Session_BE.get(sessionData).expiration;
			const now = currentTimeMillis();
			return expiration > now;
		},
		canRotate: (createdAt: number, sessionData?: TS_Object) => {
			const expiration = SessionKey_Session_BE.get(sessionData).expiration;
			const renewSessionTTL = (expiration - createdAt) * this.config.rotationFactor;

			const now = currentTimeMillis();
			return expiration - renewSessionTTL < now;
		},
		invalidate: async (_accountIds: string[] = [MemKey_AccountId.get()]): Promise<void> => {
			const accountIds = _accountIds.filter(id => id !== MemKey_AccountId.get());
			const callerAccountIncluded = accountIds.length !== _accountIds.length;
			if (accountIds.length > 0) {
				const sessions = await batchActionParallel(accountIds, 10, async ids => await this.query.custom({where: {accountId: {$in: ids}}}));
				sessions.forEach(session => session.needToRefresh = true);
				await this.set.all(sessions);
			}

			if (callerAccountIncluded) {
				await this.session.rotate(MemKey_SessionObject.get());
			}
		},
		delete: async (transaction?: Transaction) => {
			const sessionId = Header_SessionId.get();
			if (!sessionId)
				throw new ApiException(404, 'Missing sessionId');

			await this.delete.query({where: {sessionId}}, transaction);
		},
		rotate: async (dbSession: DB_Session = MemKey_SessionObject.get(), transaction?: Transaction) => {
			this.logInfo(`Rotating sessionId for Account: ${dbSession.accountId}`);
			const content = {
				accountId: dbSession.accountId,
				deviceId: dbSession.deviceId,
				prevSession: [dbSession.sessionId, ...(dbSession.prevSession || [])],
				label: 'user-auth-session'
			};
			const session = await this.session.create(content, transaction);
			MemKey_HttpResponse.get().setHeader(HeaderKey_SessionId, session.sessionId);
			return session.sessionData;
		}
	};
}

export const ModuleBE_SessionDB = new ModuleBE_SessionDB_Class();