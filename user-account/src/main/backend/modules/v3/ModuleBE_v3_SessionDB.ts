import {
	_SessionKey_SessionV3,
	DB_AccountV3,
	DBDef_v3_Session,
	DBProto_SessionType,
	HeaderKey_SessionId,
	Response_Auth_V3,
	UI_Session
} from '../../../shared';
import {DBApiConfigV3, ModuleBE_BaseDBV3} from '@nu-art/db-api-generator/backend';
import {
	__stringify,
	ApiException,
	BadImplementationException,
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


export interface CollectSessionDataV3<R extends TypedKeyValue<any, any>> {
	__collectSessionData(accountId: string): Promise<R>;
}

export const dispatch_CollectSessionDataV3 = new Dispatcher<CollectSessionDataV3<TypedKeyValue<any, any>>, '__collectSessionData'>('__collectSessionData');

// type MapTypes<T extends CollectSessionData<any>[]> =
// 	T extends [a: CollectSessionData<infer A>, ...rest: infer R] ?
// 		R extends CollectSessionData<any>[] ?
// 			[A, ...MapTypes<R>] :
// 			[] :
// 		[];

export const Header_SessionIdV3 = new HeaderKey(HeaderKey_SessionId, 403);

type Config = DBApiConfigV3<DBProto_SessionType> & {
	sessionTTLms: number
}

export const MemKey_AccountEmailV3 = new MemKey<string>('accounts--email', true);
export const MemKey_AccountIdV3 = new MemKey<string>('accounts--id', true);
export const MemKey_SessionDataV3 = new MemKey<TS_Object>('session-data', true);

export class ModuleBE_v3_SessionDB_Class
	extends ModuleBE_BaseDBV3<DBProto_SessionType, Config>
	implements CollectSessionDataV3<_SessionKey_SessionV3> {

	readonly Middleware = async () => {
		const sessionId = Header_SessionIdV3.get();
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
		MemKey_SessionDataV3.set(sessionData);
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
				MemKey_SessionDataV3.set(sessionData);
				return {sessionId: session.sessionId, ...uiAccount};
			}
		} catch (ignore) {
			//
		}

		const sessionInfo = await this.createSession(uiAccount._id);
		MemKey_SessionDataV3.set(sessionInfo.sessionData);

		return {sessionId: sessionInfo._id, ...uiAccount};
	};

	async createSession(accountId: UniqueId, manipulate?: (sessionData: TS_Object) => TS_Object) {
		const collectedData = (await dispatch_CollectSessionDataV3.dispatchModuleAsync(accountId));

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
		const sessionId = Header_SessionIdV3.get();
		if (!sessionId)
			throw new ApiException(404, 'Missing sessionId');

		await this.delete.query({where: {sessionId}}, transaction);
	};
}

export class SessionKey_BEV3<Binder extends TypedKeyValue<string | number, any>> {
	private readonly key: Binder['key'];

	constructor(key: Binder['key']) {
		this.key = key;
	}

	get(sessionData = MemKey_SessionDataV3.get()): Binder['value'] {
		if (!(this.key in sessionData))
			throw new BadImplementationException(`Couldn't find key ${this.key} in session data`);

		return sessionData[this.key] as Binder['value'];
	}
}

export const SessionKey_Session_BE_V3 = new SessionKey_BEV3<_SessionKey_SessionV3>('session');

export const ModuleBE_v3_SessionDB = new ModuleBE_v3_SessionDB_Class();