import {__stringify, ApiException, batchActionParallel, currentTimeMillis, Day, Dispatcher, filterKeys, TS_Object, TypedKeyValue} from '@nu-art/ts-common';
import {gzipSync, unzipSync} from 'zlib';
import {firestore} from 'firebase-admin';
import {_SessionKey_Session, DB_Session, DBDef_Session, DBProto_SessionType, HeaderKey_SessionId} from '../../shared';
import {Header_SessionId, MemKey_AccountId, MemKey_SessionData, MemKey_SessionObject, SessionKey_Account_BE, SessionKey_Session_BE} from '../core/consts';
import {DBApiConfigV3, ModuleBE_BaseDBV3} from '@nu-art/thunderstorm/backend';
import {MemKey_HttpResponse} from '@nu-art/thunderstorm/backend/modules/server/consts';
import Transaction = firestore.Transaction;


export type SessionCollectionParam = { accountId: string, deviceId: string };

export interface CollectSessionData<R extends TypedKeyValue<any, any>> {
	__collectSessionData(data: SessionCollectionParam, transaction?: Transaction): Promise<R>;
}

export const dispatch_CollectSessionData = new Dispatcher<CollectSessionData<TypedKeyValue<any, any>>, '__collectSessionData'>('__collectSessionData');

type Config = DBApiConfigV3<DBProto_SessionType> & {
	sessionTTLms: number
}

export class ModuleBE_SessionDB_Class
	extends ModuleBE_BaseDBV3<DBProto_SessionType, Config>
	implements CollectSessionData<_SessionKey_Session> {

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

		if (dbSession.needToRefresh || this.session.isAlmostExpired(dbSession.timestamp, sessionData)) {
			sessionData = await this.session.rotate(dbSession, sessionData);
		}

		MemKey_SessionData.set(sessionData);
	};

	constructor() {
		super(DBDef_Session);
		this.setDefaultConfig({sessionTTLms: Day});
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
		collect: async (accountId: string, deviceId: string, manipulate?: (sessionData: TS_Object) => TS_Object, transaction?: Transaction) => {
			const collectedData = (await dispatch_CollectSessionData.dispatchModuleAsync({accountId, deviceId}, transaction));
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
		create: async (accountId: string, deviceId: string, prevSession: string[] = [], transaction?: Transaction) => {
			return this.session.createCustom(accountId, deviceId, d => d, prevSession, transaction);
		},
		createCustom: async (accountId: string, deviceId: string, manipulate: (sessionData: TS_Object) => TS_Object, prevSession?: string[], transaction?: Transaction) => {
			const sessionData = await this.sessionData.collect(accountId, deviceId, manipulate, transaction);
			const session = filterKeys({
				accountId,
				deviceId,
				prevSession,
				sessionId: sessionData.encoded,
				timestamp: currentTimeMillis()
			}, 'prevSession');

			await this.set.item(session, transaction);
			return {sessionId: sessionData.encoded, sessionData: sessionData.raw};
		},
		isValid: (sessionData?: TS_Object) => {
			const expiration = SessionKey_Session_BE.get(sessionData).expiration;
			const now = currentTimeMillis();
			return expiration > now;
		},
		isAlmostExpired: (createdAt: number, sessionData?: TS_Object) => {
			const expiration = SessionKey_Session_BE.get(sessionData).expiration;
			const renewSessionTTL = (expiration - createdAt) * 0.1;

			const now = currentTimeMillis();
			return expiration - renewSessionTTL < now;
		},
		invalidate: async (accountIds: string[] = [MemKey_AccountId.get()]): Promise<void> => {
			const sessions = await batchActionParallel(accountIds, 10, async ids => await this.query.custom({where: {accountId: {$in: ids}}}));
			sessions.forEach(session => session.needToRefresh = true);
			await this.set.all(sessions);
		},
		delete: async (transaction?: Transaction) => {
			const sessionId = Header_SessionId.get();
			if (!sessionId)
				throw new ApiException(404, 'Missing sessionId');

			await this.delete.query({where: {sessionId}}, transaction);
		},
		rotate: async (dbSession: DB_Session = MemKey_SessionObject.get(), sessionData: TS_Object = MemKey_SessionData.get(), transaction?: Transaction) => {
			this.logInfo(`Rotating sessionId for Account: ${SessionKey_Account_BE.get(sessionData)._id}`);

			const session = await this.session.create(dbSession.accountId, dbSession.deviceId, [dbSession.sessionId, ...(dbSession.prevSession || [])], transaction);
			MemKey_HttpResponse.get().setHeader(HeaderKey_SessionId, session.sessionId);
			return session.sessionData;
		}
	};
}

export const ModuleBE_SessionDB = new ModuleBE_SessionDB_Class();