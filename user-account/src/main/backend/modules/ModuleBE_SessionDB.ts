import {__stringify, ApiException, batchActionParallel, currentTimeMillis, Day, Dispatcher, TS_Object, TypedKeyValue} from '@nu-art/ts-common';
import {gzipSync, unzipSync} from 'zlib';
import {firestore} from 'firebase-admin';
import {_SessionKey_Session, DBDef_Session, DBProto_SessionType} from '../../shared';
import {Header_SessionId, MemKey_SessionData, SessionKey_Session_BE} from '../core/consts';
import {DBApiConfigV3, ModuleBE_BaseDBV3} from '@nu-art/thunderstorm/backend';
import Transaction = firestore.Transaction;


export interface CollectSessionData<R extends TypedKeyValue<any, any>> {
	__collectSessionData(accountId: string, transaction?: Transaction): Promise<R>;
}

export const dispatch_CollectSessionData = new Dispatcher<CollectSessionData<TypedKeyValue<any, any>>, '__collectSessionData'>('__collectSessionData');

// type MapTypes<T extends CollectSessionData<any>[]> =
// 	T extends [a: CollectSessionData<infer A>, ...rest: infer R] ?
// 		R extends CollectSessionData<any>[] ?
// 			[A, ...MapTypes<R>] :
// 			[] :
// 		[];

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

		try {
			await ModuleBE_SessionDB.query.uniqueWhere({sessionId});
		} catch (err) {
			throw new ApiException(401, `Invalid session id: ${sessionId}`);
		}

		const sessionData = this.sessionData.decode(sessionId);
		MemKey_SessionData.set(sessionData);

		if (!this.session.isValid())
			throw new ApiException(401, 'Session timed out');

	};

	constructor() {
		super(DBDef_Session);
		this.setDefaultConfig({sessionTTLms: Day});
	}

	async __collectSessionData(accountId: string) {
		const now = currentTimeMillis();
		return {
			key: 'session' as const,
			value: {
				timestamp: now,
				expiration: now + this.config.sessionTTLms,
			}
		};
	}

	private sessionData = {
		encode: async (sessionData: TS_Object) => gzipSync(Buffer.from(__stringify(sessionData), 'utf8')).toString('base64'),
		decode: (sessionId: string): TS_Object => JSON.parse((unzipSync(Buffer.from(sessionId, 'base64'))).toString('utf8')),
		collect: async (accountId: string, manipulate?: (sessionData: TS_Object) => TS_Object, transaction?: Transaction) => {
			const collectedData = (await dispatch_CollectSessionData.dispatchModuleAsync(accountId, transaction));
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
		get: async (accountId: string, transaction?: Transaction) => {
			return (await this.query.custom({where: {accountId}}, transaction))[0];
		},
		create: async (accountId: string, transaction?: Transaction) => {
			return this.session.createCustom(accountId, d => d, transaction);
		},
		createCustom: async (accountId: string, manipulate: (sessionData: TS_Object) => TS_Object, transaction?: Transaction) => {
			const sessionData = await this.sessionData.collect(accountId, manipulate);
			const session = {
				accountId: accountId,
				sessionId: sessionData.encoded,
				timestamp: currentTimeMillis()
			};

			await this.set.item(session, transaction);
			return {sessionId: sessionData.encoded, sessionData};
		},
		isValid: (sessionData?: TS_Object) => {
			const expiration = SessionKey_Session_BE.get(sessionData).expiration;
			const now = currentTimeMillis();
			this.logInfo(`expiration - now: ${expiration} - ${now} = ${expiration - now}`);
			return expiration > now;
		},
		getOrCreate: async (accountId: string, transaction?: Transaction) => {
			const dbSession = await this.session.get(accountId, transaction);
			if (dbSession) {
				const sessionData = this.sessionData.decode(dbSession.sessionId);
				if (this.session.isValid(sessionData))
					this.sessionData.setToMemKey(sessionData);

				return dbSession.sessionId;
			}

			const session = await this.session.create(accountId);
			this.sessionData.setToMemKey(session.sessionData);
			return session;
		},
		invalidate: async (accountIds: string[]): Promise<void> => {
			await batchActionParallel(accountIds, 10, async ids => await this.delete.query({where: {accountId: {$in: ids}}}));
		},
		delete: async (transaction?: Transaction) => {
			const sessionId = Header_SessionId.get();
			if (!sessionId)
				throw new ApiException(404, 'Missing sessionId');

			await this.delete.query({where: {sessionId}}, transaction);
		}
	};

}

export const ModuleBE_SessionDB = new ModuleBE_SessionDB_Class();