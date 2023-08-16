import {ApiCallerEventType, ModuleFE_v3_BaseApi} from '@nu-art/db-api-generator/frontend';
import {
	_SessionKey_AccountV3,
	ApiDefFE_AccountV3,
	ApiStructFE_AccountV3,
	DB_AccountV3,
	DBDef_v3_Accounts,
	DBProto_AccountType,
	HeaderKey_SessionId,
	QueryParam_Email,
	QueryParam_SessionId,
	Response_Auth_V3,
	Response_LoginSAML,
	UI_Account
} from '../../../shared';
import {
	apiWithBody,
	apiWithQuery,
	getQueryParameter,
	ModuleFE_BrowserHistory,
	ModuleFE_XHR,
	StorageKey,
	ThunderDispatcher
} from '@nu-art/thunderstorm/frontend';
import {ApiDefCaller, BaseHttpRequest} from '@nu-art/thunderstorm';
import {ungzip} from 'pako';
import {BadImplementationException, cloneObj, composeUrl, currentTimeMillis, exists, TS_Object, TypedKeyValue} from '@nu-art/ts-common';
import {OnAuthRequiredListener} from '@nu-art/thunderstorm/shared/no-auth-listener';


export const StorageKey_SessionIdV3 = new StorageKey<string>(`storage-${HeaderKey_SessionId}`);
export const StorageKey_SessionTimeoutTimestampV3 = new StorageKey<number>(`storage-accounts__session-timeout`);

export interface OnLoginStatusUpdatedV3 {
	__onLoginStatusUpdatedV3: () => void;
}

export interface OnAccountsUpdatedV3 {
	__onAccountsUpdated: (...params: ApiCallerEventType<DB_AccountV3>) => void;
}

export enum LoggedStatusV3 {
	VALIDATING,
	LOGGED_OUT,
	SESSION_TIMEOUT,
	LOGGED_IN
}

export const dispatch_onLoginStatusChangedV3 = new ThunderDispatcher<OnLoginStatusUpdatedV3, '__onLoginStatusUpdatedV3'>('__onLoginStatusUpdatedV3');
export const dispatch_onAccountsUpdatedV3 = new ThunderDispatcher<OnAccountsUpdatedV3, '__onAccountsUpdated'>('__onAccountsUpdated');

class ModuleFE_Account_v3_Class
	extends ModuleFE_v3_BaseApi<DBProto_AccountType>
	implements ApiDefCaller<ApiStructFE_AccountV3>, OnAuthRequiredListener {
	readonly vv1: ApiDefCaller<ApiStructFE_AccountV3>['vv1'];
	private status: LoggedStatusV3 = LoggedStatusV3.VALIDATING;
	accountId!: string;
	// @ts-ignore
	private sessionData!: TS_Object;

	constructor() {
		super(DBDef_v3_Accounts, dispatch_onAccountsUpdatedV3);

		this.vv1 = {
			registerAccount: apiWithBody(ApiDefFE_AccountV3.vv1.registerAccount, this.setLoginInfo),
			createAccount: apiWithBody(ApiDefFE_AccountV3.vv1.createAccount, this.onAccountCreated),
			changePassword: apiWithBody(ApiDefFE_AccountV3.vv1.changePassword),
			login: apiWithBody(ApiDefFE_AccountV3.vv1.login, this.setLoginInfo),
			loginSaml: apiWithQuery(ApiDefFE_AccountV3.vv1.loginSaml, this.onLoginCompletedSAML),
			logout: apiWithQuery(ApiDefFE_AccountV3.vv1.logout),
			createToken: apiWithBody(ApiDefFE_AccountV3.vv1.createToken),
			setPassword: apiWithBody(ApiDefFE_AccountV3.vv1.setPassword),
		};
	}

	__onAuthRequiredListener(request: BaseHttpRequest<any>) {
		StorageKey_SessionIdV3.delete();
		StorageKey_SessionTimeoutTimestampV3.set(currentTimeMillis());
		return this.setLoggedStatus(LoggedStatusV3.SESSION_TIMEOUT);
	}

	getAccounts() {
		return this.cache.all().map(i => cloneObj(i)) as UI_Account[];
	}

	getLoggedStatus = () => this.status;

	isStatus = (status: LoggedStatusV3) => this.status === status;

	private onAccountCreated = async (response: DB_AccountV3) => {
		await this.onEntriesUpdated([response as DB_AccountV3]);
	};

	protected init(): void {
		ModuleFE_XHR.addDefaultHeader(HeaderKey_SessionId, () => StorageKey_SessionIdV3.get());
		// ModuleFE_XHR.addDefaultHeader(HeaderKey_Email, () => StorageKey_UserEmail.get());

		const email = getQueryParameter(QueryParam_Email);
		const sessionId = getQueryParameter(QueryParam_SessionId);

		if (email && sessionId) {
			StorageKey_SessionIdV3.set(String(sessionId));

			ModuleFE_BrowserHistory.removeQueryParam(QueryParam_Email);
			ModuleFE_BrowserHistory.removeQueryParam(QueryParam_SessionId);
		}

		const _sessionId = StorageKey_SessionIdV3.get();
		if (_sessionId)
			return this.processSessionStatus(_sessionId);

		this.logDebug('login out user.... ');
		this.setLoggedStatus(LoggedStatusV3.LOGGED_OUT);
	}

	private processSessionStatus(sessionId: string) {
		const now = currentTimeMillis();
		const sessionData = this.decode(sessionId);
		if (!exists(sessionData.session.expiration) || now > sessionData.session.expiration)
			return this.setLoggedStatus(LoggedStatusV3.SESSION_TIMEOUT);

		this.accountId = sessionData.account._id;
		this.sessionData = sessionData;
		return this.setLoggedStatus(LoggedStatusV3.LOGGED_IN);
	}

	protected setLoggedStatus = (newStatus: LoggedStatusV3) => {
		if (this.status === newStatus)
			return;

		const pervStatus = this.status;
		this.status = newStatus;
		if (newStatus === LoggedStatusV3.LOGGED_IN || newStatus === LoggedStatusV3.LOGGED_OUT)
			StorageKey_SessionTimeoutTimestampV3.delete();

		this.logInfo(`Login status changes: ${LoggedStatusV3[pervStatus]} => ${LoggedStatusV3[newStatus]}`);
		dispatch_onLoginStatusChangedV3.dispatchUI();
		dispatch_onLoginStatusChangedV3.dispatchModule();
	};

	private setLoginInfo = async (response: Response_Auth_V3) => {
		StorageKey_SessionIdV3.set(response.sessionId);
		this.processSessionStatus(response.sessionId);
		this.accountId = response._id;
		this.setLoggedStatus(LoggedStatusV3.LOGGED_IN);
	};

	private onLoginCompletedSAML = async (response: Response_LoginSAML) => {
		if (!response.loginUrl)
			return;

		window.location.href = response.loginUrl;
	};

	public composeSAMLUrl = () => {
		return composeUrl(window.location.href, {
			[QueryParam_SessionId]: QueryParam_SessionId.toUpperCase(),
			[QueryParam_Email]: QueryParam_Email.toUpperCase(),
		});
	};

	public getSessionId = (): string => {
		return StorageKey_SessionIdV3.get('');
	};

	private decode(sessionData: string) {
		if (!sessionData.length)
			return;

		return JSON.parse(new TextDecoder('utf8').decode(ungzip(Uint8Array.from(atob(sessionData), c => c.charCodeAt(0)))));
	}

	logout = (url?: string) => {
		this.vv1.logout({}).execute();
		StorageKey_SessionIdV3.delete();
		if (url)
			return window.location.href = url;

		this.setLoggedStatus(LoggedStatusV3.LOGGED_OUT);
	};
}

export class SessionKey_FEV3<Binder extends TypedKeyValue<string | number, any>> {
	private readonly key: Binder['key'];

	constructor(key: Binder['key']) {
		this.key = key;
	}

	get(): Binder['value'] {
		// @ts-ignore
		const sessionData = ModuleFE_AccountV3.sessionData;
		// if (!sessionData)
		// 	return undefined;

		if (!(this.key in sessionData))
			throw new BadImplementationException(`Couldn't find key ${this.key} in session data`);

		return sessionData[this.key] as Binder['value'];
	}
}

export const SessionKey_Account_FE_V3 = new SessionKey_FEV3<_SessionKey_AccountV3>('account');

export const ModuleFE_AccountV3 = new ModuleFE_Account_v3_Class();