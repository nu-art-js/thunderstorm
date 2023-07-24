import {ModuleBE_BaseDBV2} from '@nu-art/db-api-generator/backend/ModuleBE_BaseDBV2';
import {DB_Account_V2, DB_Session_V2, DBDef_Session, Response_Auth} from '../../../shared/v2';
import {DBApiConfig} from '@nu-art/db-api-generator/backend';
import {MemKey_SessionData, Middleware_ValidateSession} from '../../core/accounts-middleware';
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
import {HeaderKey_SessionId} from '../../../shared/api';
import {getUIAccount, ModuleBE_v2_AccountDB} from './ModuleBE_v2_AccountDB';
import {gzipSync, unzipSync} from 'zlib';
import {HeaderKey} from '@nu-art/thunderstorm/backend';


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

	private async getUserEmailFromSession(session: PreDB<DB_Session_V2>) {
		const account = await ModuleBE_v2_AccountDB.query.unique(session.userId);
		if (!account) {
			await this.delete.item(session);
			throw new ApiException(403, `No user found for session: ${__stringify(session)}`);
		}

		return getUIAccount(account);
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

	upsertSession = async (account: DB_Account_V2): Promise<Response_Auth> => {
		let session: PreDB<DB_Session_V2> = await this.query.uniqueCustom({where: {userId: account._id}});
		let sessionData: TS_Object;
		if (!session || this.TTLExpired(session)) {
			sessionData = (await dispatch_CollectSessionData.dispatchModuleAsync(account._id))
				.reduce((sessionData, moduleSessionData) => {
					_keys(moduleSessionData).forEach(key => {
						if (sessionData[key])
							throw new BadImplementationException(`Error while building session data.. duplicated keys: ${key as string}\none: ${__stringify(sessionData, true)}\ntwo: ${__stringify(moduleSessionData, true)}`);

						sessionData[key] = moduleSessionData[key];
					});
					return sessionData;
				}, {accountId: account._id, email: account.email} as TS_Object);

			const sessionDataAsString = await ModuleBE_v2_SessionDB_Class.encodeSessionData(sessionData);

			session = {
				userId: account._id,
				sessionId: sessionDataAsString,
				timestamp: currentTimeMillis()
			};

			await this.set.item(session);
		}

		const uiAccount = await this.getUserEmailFromSession(session);
		// Middleware_ValidateSession_UpdateMemKeys(sessionData);

		return {sessionId: session.sessionId, email: uiAccount.email, _id: uiAccount._id};
	};

	logout = async () => {
		const sessionId = Header_SessionId.get();
		if (!sessionId)
			throw new ApiException(404, 'Missing sessionId');

		await this.delete.query({where: {sessionId}});
	};
}


export const ModuleBE_v2_SessionDB = new ModuleBE_v2_SessionDB_Class();