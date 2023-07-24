import {ModuleBE_BaseDBV2} from '@nu-art/db-api-generator/backend/ModuleBE_BaseDBV2';
import {DB_Account_V2, DB_Session_V2, DBDef_Session, Response_Auth} from '../../../shared/v2';
import {DBApiConfig} from '@nu-art/db-api-generator/backend';
import {Middleware_ValidateSession, Middleware_ValidateSession_UpdateMemKeys} from '../../core/accounts-middleware';
import {
	__stringify,
	_keys,
	ApiException,
	BadImplementationException,
	currentTimeMillis,
	Day,
	Dispatcher,
	hashPasswordWithSalt,
	MergeTypes,
	NonEmptyArray,
	PreDB,
	TS_Object
} from '@nu-art/ts-common';
import {QueryParams} from '@nu-art/thunderstorm';
import {HeaderKey_SessionId, Request_LoginAccount, UI_Account} from '../../../shared/api';
import {dispatch_onUserLogin, getUIAccount, ModuleBE_v2_AccountDB} from './ModuleBE_v2_AccountDB';
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
			userId: accountId
		};
	}

	validateSession = async (params: QueryParams): Promise<UI_Account> => {
		const sessionId = Header_SessionId.get();
		if (!sessionId)
			throw new ApiException(404, 'Missing sessionId');

		return this.validateSessionId(sessionId);
	};
	validateSessionId = async (sessionId: any) => {
		if (typeof sessionId !== 'string')
			throw new ApiException(401, `Invalid session id: ${sessionId}`);

		const query = {where: {sessionId}};

		const session = await this.query.uniqueCustom(query);
		if (!session)
			throw new ApiException(401, `Invalid session id: ${sessionId}`);

		if (this.TTLExpired(session))
			throw new ApiException(401, 'Session timed out');

		return await this.getUserEmailFromSession(session);
	};

	private async getUserEmailFromSession(session: PreDB<DB_Session_V2>) {
		const account = await ModuleBE_v2_AccountDB.query.unique(session.userId);
		if (!account) {
			await this.delete.item(session);
			throw new ApiException(403, `No user found for session: ${__stringify(session)}`);
		}

		return getUIAccount(account);
	}

	private TTLExpired = (session: PreDB<DB_Session_V2>) => {
		const delta = currentTimeMillis() - session.timestamp;
		return delta > this.config.sessionTTLms || delta < 0;
	};

	static async encodeSessionData(sessionData: TS_Object) {
		return (await gzipSync(Buffer.from(__stringify(sessionData), 'utf8'))).toString('base64');
	}

	/**
	 * @param modules - A list of modules that implement CollectSessionData, defines the decoded object's type
	 */
	static decodeSessionData<T extends NonEmptyArray<CollectSessionData<{}>>>(...modules: T): MergeTypes<MapTypes<T>> {
		const sessionData = Header_SessionId.get();
		try {
			return JSON.parse((unzipSync(Buffer.from(sessionData, 'base64'))).toString('utf8'));
		} catch (e: any) {
			throw new ApiException(403, 'Cannot parse session data', e);
		}
	}

	upsertSession = async (account: DB_Account_V2): Promise<Response_Auth> => {
		let session: PreDB<DB_Session_V2> = await this.query.uniqueCustom({where: {userId: account._id}});
		if (!session || this.TTLExpired(session)) {
			const sessionData = (await dispatch_CollectSessionData.dispatchModuleAsync(account._id))
				.reduce((sessionData, moduleSessionData) => {
					_keys(moduleSessionData).forEach(key => {
						if (sessionData[key])
							throw new BadImplementationException(`Error while building session data.. duplicated keys: ${key as string}\none: ${__stringify(sessionData, true)}\ntwo: ${__stringify(moduleSessionData, true)}`);

						sessionData[key] = moduleSessionData[key];
					});
					return sessionData;
				}, {} as { [key: string]: TS_Object });

			const sessionDataAsString = await ModuleBE_v2_SessionDB_Class.encodeSessionData(sessionData);

			session = {
				userId: account._id,
				sessionId: sessionDataAsString,
				timestamp: currentTimeMillis()
			};

			await this.set.item(session);
		}

		const uiAccount = await this.getUserEmailFromSession(session);
		Middleware_ValidateSession_UpdateMemKeys(uiAccount);

		await dispatch_onUserLogin.dispatchModuleAsync(uiAccount);
		return {sessionId: session.sessionId, email: uiAccount.email, _id: uiAccount._id};
	};

	login = async (request: Request_LoginAccount): Promise<Response_Auth> => {
		const {account, session} = await this.loginImpl(request);

		await dispatch_onUserLogin.dispatchModuleAsync(getUIAccount(account));
		return session;
	};

	async loginImpl(request: Request_LoginAccount, transaction?: FirebaseFirestore.Transaction) {
		request.email = request.email.toLowerCase();
		const query = {where: {email: request.email}};
		const account = await ModuleBE_v2_AccountDB.query.uniqueCustom(query, transaction);
		if (!account)
			throw new ApiException(401, 'Account does not exists');

		if (!account.saltedPassword || !account.salt)
			throw new ApiException(401, 'Account login using SAML');

		if (account.saltedPassword !== hashPasswordWithSalt(account.salt, request.password))
			throw new ApiException(401, 'Wrong username or password.');
		if (!account._id) {
			// account._id = generateHex(32);
			await ModuleBE_v2_AccountDB.set.item(account, transaction);
		}

		const session = await this.upsertSession(account);
		return {account, session};
	}

	logout = async () => {
		const sessionId = Header_SessionId.get();
		if (!sessionId)
			throw new ApiException(404, 'Missing sessionId');

		await this.delete.query({where: {sessionId}});
	};
}


export const ModuleBE_v2_SessionDB = new ModuleBE_v2_SessionDB_Class();