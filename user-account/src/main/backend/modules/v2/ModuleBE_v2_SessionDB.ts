import {ModuleBE_BaseDBV2} from '@nu-art/db-api-generator/backend/ModuleBE_BaseDBV2';
import {DB_Session_V2, DBDef_Session, Response_Auth, HeaderKey_SessionId, UI_Account} from '../../../shared';
import {DBApiConfig} from '@nu-art/db-api-generator/backend';
import {
	__stringify,
	_keys,
	ApiException,
	BadImplementationException,
	currentTimeMillis,
	Day,
	Dispatcher,
	MergeTypes,
	NonEmptyArray,
	PreDB,
	TS_Object
} from '@nu-art/ts-common';
import {gzipSync, unzipSync} from 'zlib';
import {HeaderKey} from '@nu-art/thunderstorm/backend';
import {firestore} from 'firebase-admin';
import Transaction = firestore.Transaction;
import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';


export interface CollectSessionData<R extends TS_Object> {
	__collectSessionData(accountId: string): Promise<R>;
}

export const dispatch_CollectSessionData = new Dispatcher<CollectSessionData<{}>, '__collectSessionData'>('__collectSessionData');

type MapTypes<T extends CollectSessionData<any>[]> =
	T extends [a: CollectSessionData<infer A>, ...rest: infer R] ?
		R extends CollectSessionData<any>[] ?
			[A, ...MapTypes<R>] :
			[] :
		[];

export const Header_SessionId = new HeaderKey(HeaderKey_SessionId);

type Config = DBApiConfig<DB_Session_V2> & {
	sessionTTLms: number

}

export const MemKey_AccountEmail = new MemKey<string>('accounts--email', true);
export const MemKey_AccountId = new MemKey<string>('accounts--id', true);
export const MemKey_SessionData = new MemKey<TS_Object>('session-data', true);

export function Middleware_ValidateSession_UpdateMemKeys(sessionData: TS_Object) {
	MemKey_SessionData.set(sessionData);

	MemKey_AccountEmail.set(sessionData.email);
	MemKey_AccountId.set(sessionData.accountId);
}

export class ModuleBE_v2_SessionDB_Class
	extends ModuleBE_BaseDBV2<DB_Session_V2, Config>
	implements CollectSessionData<any> {

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
		Middleware_ValidateSession_UpdateMemKeys(sessionData);
	};

	constructor() {
		super(DBDef_Session);
		this.setDefaultConfig({sessionTTLms: Day});
	}

	async __collectSessionData(accountId: string) {
		const now = currentTimeMillis();
		return {
			timestamp: now,
			expiration: now + this.config.sessionTTLms,
		};
	}

	TTLExpired = (session: PreDB<DB_Session_V2>) => {
		const delta = currentTimeMillis() - session.timestamp;
		return delta > this.config.sessionTTLms || delta < 0;
	};

	private async encodeSessionData(sessionData: TS_Object) {
		return (await gzipSync(Buffer.from(__stringify(sessionData), 'utf8'))).toString('base64');
	}

	/**
	 * @param modules - A list of modules that implement CollectSessionData, defines the decoded object's type
	 */
	getSessionData<T extends NonEmptyArray<CollectSessionData<{}>>>(...modules: T): MergeTypes<MapTypes<T>> {
		return MemKey_SessionData.get() as MergeTypes<MapTypes<T>>;
	}

	private decodeSessionData(sessionId: string) {
		return JSON.parse((unzipSync(Buffer.from(sessionId, 'base64'))).toString('utf8'));
	}

	upsertSession = async (uiAccount: UI_Account, transaction?: Transaction): Promise<Response_Auth> => {
		try {
			const session = await this.query.uniqueWhere({accountId: uiAccount._id}, transaction);
			if (!this.TTLExpired(session)) {
				const sessionData = this.decodeSessionData(session.sessionId);
				Middleware_ValidateSession_UpdateMemKeys(sessionData);
				return {sessionId: session.sessionId, ...uiAccount};
			}
		} catch (ignore) {
			//
		}

		const sessionData = (await dispatch_CollectSessionData.dispatchModuleAsync(uiAccount._id))
			.reduce((sessionData, moduleSessionData) => {
				_keys(moduleSessionData).forEach(key => {
					if (sessionData[key])
						throw new BadImplementationException(`Error while building session data.. duplicated keys: ${key as string}\none: ${__stringify(sessionData, true)}\ntwo: ${__stringify(moduleSessionData, true)}`);

					sessionData[key] = moduleSessionData[key];
				});
				return sessionData;
			}, {accountId: uiAccount._id, email: uiAccount.email} as TS_Object);

		Middleware_ValidateSession_UpdateMemKeys(sessionData);
		const sessionId = await this.encodeSessionData(sessionData);

		const session = {
			accountId: uiAccount._id,
			sessionId,
			timestamp: currentTimeMillis()
		};

		await this.set.item(session);

		return {sessionId: session.sessionId, ...uiAccount};
	};

	logout = async (transaction?: Transaction) => {
		const sessionId = Header_SessionId.get();
		if (!sessionId)
			throw new ApiException(404, 'Missing sessionId');

		await this.delete.query({where: {sessionId}}, transaction);
	};
}

export const ModuleBE_v2_SessionDB = new ModuleBE_v2_SessionDB_Class();