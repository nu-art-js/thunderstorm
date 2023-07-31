import {ModuleBE_BaseDBV2} from '@nu-art/db-api-generator/backend/ModuleBE_BaseDBV2';
import {DB_Session_V2, DBDef_Session, Response_Auth, HeaderKey_SessionId, UI_Account} from '../../../shared/v2';
import {DBApiConfig} from '@nu-art/db-api-generator/backend';
import {MemKey_SessionData, Middleware_ValidateSession, Middleware_ValidateSession_UpdateMemKeys} from '../../core/accounts-middleware';
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

export class ModuleBE_v2_SessionDB_Class
	extends ModuleBE_BaseDBV2<DB_Session_V2, Config>
	implements CollectSessionData<any> {

	readonly Middleware = Middleware_ValidateSession;

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

	static async encodeSessionData(sessionData: TS_Object) {
		return (await gzipSync(Buffer.from(__stringify(sessionData), 'utf8'))).toString('base64');
	}

	/**
	 * @param modules - A list of modules that implement CollectSessionData, defines the decoded object's type
	 */
	static getSessionData<T extends NonEmptyArray<CollectSessionData<{}>>>(...modules: T): MergeTypes<MapTypes<T>> {
		return MemKey_SessionData.get() as MergeTypes<MapTypes<T>>;
	}

	public static decodeSessionData(sessionId: string) {
		return JSON.parse((unzipSync(Buffer.from(sessionId, 'base64'))).toString('utf8'));
	}

	upsertSession = async (uiAccount: UI_Account, transaction?: Transaction): Promise<Response_Auth> => {
		try {
			const session = await this.query.uniqueWhere({accountId: uiAccount._id}, transaction);
			if (!this.TTLExpired(session)) {
				const sessionData = ModuleBE_v2_SessionDB_Class.decodeSessionData(session.sessionId);
				Middleware_ValidateSession_UpdateMemKeys(sessionData);
				return {sessionId: session.sessionId, email: uiAccount.email, _id: uiAccount._id};
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
		const sessionId = await ModuleBE_v2_SessionDB_Class.encodeSessionData(sessionData);

		const session = {
			accountId: uiAccount._id,
			sessionId,
			timestamp: currentTimeMillis()
		};

		await this.set.item(session);

		return {sessionId: session.sessionId, email: uiAccount.email, _id: uiAccount._id};
	};

	logout = async (transaction?: Transaction) => {
		const sessionId = Header_SessionId.get();
		if (!sessionId)
			throw new ApiException(404, 'Missing sessionId');

		await this.delete.query({where: {sessionId}}, transaction);
	};
}

export const ModuleBE_v2_SessionDB = new ModuleBE_v2_SessionDB_Class();