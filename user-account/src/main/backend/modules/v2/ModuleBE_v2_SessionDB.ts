import {ModuleBE_BaseDBV2} from '@nu-art/db-api-generator/backend/ModuleBE_BaseDBV2';
import {_SessionKey_Session, DB_Session_V2, DBDef_Session, Response_Auth, UI_Account} from '../../../shared';
import {DBApiConfig} from '@nu-art/db-api-generator/backend';
import {
	__stringify,
	ApiException,
	BadImplementationException,
	currentTimeMillis,
	Day,
	Dispatcher,
	PreDB,
	TS_Object,
	TypedKeyValue,
	UniqueId
} from '@nu-art/ts-common';
import {gzipSync, unzipSync} from 'zlib';
import {firestore} from 'firebase-admin';
import {Header_SessionId, MemKey_SessionData} from '../../core/consts';
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


type Config = DBApiConfig<DB_Session_V2> & {
	sessionTTLms: number
}


export class ModuleBE_v2_SessionDB_Class
	extends ModuleBE_BaseDBV2<DB_Session_V2, Config>
	implements CollectSessionData<_SessionKey_Session> {

	readonly Middleware = async () => {
		const sessionId = Header_SessionId.get();
		if (typeof sessionId !== 'string')
			throw new ApiException(401, `Invalid session id: ${sessionId}`);

		let session;
		try {
			session = await ModuleBE_v2_SessionDB.query.uniqueWhere({sessionId});
		} catch (err) {
			throw new ApiException(401, `Invalid session id: ${sessionId}`);
		}

		if (ModuleBE_v2_SessionDB.TTLExpired(session))
			throw new ApiException(401, 'Session timed out');

		const sessionData = this.decodeSessionData(sessionId);
		MemKey_SessionData.set(sessionData);
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

	TTLExpired = (session: PreDB<DB_Session_V2>) => {
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

	getOrCreateSession = async (uiAccount: UI_Account, transaction?: Transaction): Promise<Response_Auth> => {
		const session = (await this.query.custom({where: {accountId: uiAccount._id}}, transaction))?.[0];
		if (session && !this.TTLExpired(session)) {
			const sessionData = this.decodeSessionData(session.sessionId);
			MemKey_SessionData.set(sessionData);
			return {sessionId: session.sessionId, ...uiAccount};
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

export const ModuleBE_v2_SessionDB = new ModuleBE_v2_SessionDB_Class();

export class SessionKey_BE<Binder extends TypedKeyValue<string | number, any>> {
	private readonly key: Binder['key'];

	constructor(key: Binder['key']) {
		this.key = key;
	}

	get(sessionData = MemKey_SessionData.get()): Binder['value'] {
		if (!(this.key in sessionData))
			throw new BadImplementationException(`Couldn't find key ${this.key} in session data`);

		return sessionData[this.key] as Binder['value'];
	}
}

export const SessionKey_Session_BE = new SessionKey_BE<_SessionKey_Session>('session');
