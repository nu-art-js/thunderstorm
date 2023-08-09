import {
	_SessionKey_SessionV3,
	DB_AccountV3,
	DB_Session_V2,
	DBDef_v3_Session,
	DBProto_SessionType,
	HeaderKey_SessionId,
	Response_Auth_V3,
	UI_Session
} from '../../../shared';
import {DBApiConfig, ModuleBE_BaseDBV3} from '@nu-art/db-api-generator/backend';
import {
	__stringify,
	ApiException,
	currentTimeMillis,
	Day,
	Dispatcher,
	TS_Object,
	TypedKeyValue,
	UniqueId
} from '@nu-art/ts-common';
import {gzipSync, unzipSync} from 'zlib';
import {HeaderKey} from '@nu-art/thunderstorm/backend';
import {firestore} from 'firebase-admin';
import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';
import Transaction = firestore.Transaction;


export interface CollectSessionData<R extends TypedKeyValue<any, any>> {
	__collectSessionData(accountId: string): Promise<R>;
}

export const dispatch_CollectSessionData = new Dispatcher<CollectSessionData<TypedKeyValue<any, any>>, '__collectSessionData'>('__collectSessionData');

// type MapTypes<T extends CollectSessionData<any>[]> =
// 	T extends [a: CollectSessionData<infer A>, ...rest: infer R] ?
// 		R extends CollectSessionData<any>[] ?
// 			[A, ...MapTypes<R>] :
// 			[] :
// 		[];

export const Header_SessionId = new HeaderKey(HeaderKey_SessionId);

type Config = DBApiConfig<DB_Session_V2> & {
	sessionTTLms: number
}

export const MemKey_AccountEmail = new MemKey<string>('accounts--email', true);
export const MemKey_AccountId = new MemKey<string>('accounts--id', true);
export const MemKey_SessionData = new MemKey<TS_Object>('session-data', true);


export class ModuleBE_v3_SessionDB_Class
	extends ModuleBE_BaseDBV3<DBProto_SessionType, Config>
	implements CollectSessionData<_SessionKey_SessionV3> {

	readonly Middleware = async () => {
		const sessionId = Header_SessionId.get();
		if (typeof sessionId !== 'string')
			throw new ApiException(401, `Invalid session id: ${sessionId}`);

		let session;
		try {
			session = await ModuleBE_v3_SessionDB.query.uniqueWhere({sessionId});
		} catch (err) {
			throw new ApiException(401, `Invalid session id: ${sessionId}`);
		}

		if (ModuleBE_v3_SessionDB.TTLExpired(session))
			throw new ApiException(401, 'Session timed out');

		const sessionData = this.decodeSessionData(sessionId);
		MemKey_SessionData.set(sessionData);
	};

	constructor() {
		super(DBDef_v3_Session);
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

	TTLExpired = (session: UI_Session) => {
		const delta = currentTimeMillis() - session.timestamp;
		return delta > this.config.sessionTTLms || delta < 0;
	};

	private async encodeSessionData(sessionData: TS_Object) {
		return (await gzipSync(Buffer.from(__stringify(sessionData), 'utf8'))).toString('base64');
	}

	// /**
	//  * @param modules - A list of modules that implement CollectSessionData, defines the decoded object's type
	//  */
	// getSessionData<T extends NonEmptyArray<CollectSessionData<{}>>>(...modules: T): MergeTypes<MapTypes<T>> {
	// 	return MemKey_SessionData.get() as MergeTypes<MapTypes<T>>;
	// }

	private decodeSessionData(sessionId: string) {
		return JSON.parse((unzipSync(Buffer.from(sessionId, 'base64'))).toString('utf8'));
	}

	getOrCreateSession = async (uiAccount: DB_AccountV3, transaction?: Transaction): Promise<Response_Auth_V3> => {
		try {
			const session = await this.query.uniqueWhere({accountId: uiAccount._id}, transaction);
			if (!this.TTLExpired(session)) {
				const sessionData = this.decodeSessionData(session.sessionId);
				MemKey_SessionData.set(sessionData);
				return {sessionId: session.sessionId, ...uiAccount};
			}
		} catch (ignore) {
			//
		}

		const sessionInfo = await this.createSession(uiAccount._id);
		MemKey_SessionData.set(sessionInfo.sessionData);

		return {sessionId: sessionInfo._id, ...uiAccount};
	};

	async createSession(accountId: UniqueId, manipulate?: (sessionData: TS_Object) => TS_Object) {
		const collectedData = (await dispatch_CollectSessionData.dispatchModuleAsync(accountId));

		let sessionData = collectedData.reduce((sessionData: TS_Object, moduleSessionData) => {
			sessionData[moduleSessionData.key] = moduleSessionData.value;
			return sessionData;
		}, {});

		sessionData = manipulate?.(sessionData) ?? sessionData;
		const sessionId = await this.encodeSessionData(sessionData);

		const session = {
			accountId: accountId,
			sessionId,
			timestamp: currentTimeMillis()
		};

		await this.set.item(session);
		return {_id: session.sessionId, sessionData: sessionData};
	}

	logout = async (transaction?: Transaction) => {
		const sessionId = Header_SessionId.get();
		if (!sessionId)
			throw new ApiException(404, 'Missing sessionId');

		await this.delete.query({where: {sessionId}}, transaction);
	};
}

export const ModuleBE_v3_SessionDB = new ModuleBE_v3_SessionDB_Class();