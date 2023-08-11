import {ApiCallerEventType, ModuleFE_v3_BaseApi} from '@nu-art/db-api-generator/frontend';
import {
	ApiDefFE_AccountV3,
	ApiStructFE_AccountV3,
	DB_Account_V2,
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
import {composeUrl, currentTimeMillis, exists, TS_Object} from '@nu-art/ts-common';
import {OnAuthRequiredListener} from '@nu-art/thunderstorm/shared/no-auth-listener';


export const StorageKey_SessionId = new StorageKey<string>(`storage-${HeaderKey_SessionId}`);
export const StorageKey_SessionTimeoutTimestamp = new StorageKey<number>(`storage-accounts__session-timeout`);

export interface OnLoginStatusUpdated {
	__onLoginStatusUpdated: () => void;
}

export interface OnAccountsUpdated {
	__onAccountsUpdated: (...params: ApiCallerEventType<DB_Account_V2>) => void;
}

export enum LoggedStatus {
	VALIDATING,
	LOGGED_OUT,
	SESSION_TIMEOUT,
	LOGGED_IN
}

export const dispatch_onLoginStatusChanged = new ThunderDispatcher<OnLoginStatusUpdated, '__onLoginStatusUpdated'>('__onLoginStatusUpdated');
export const dispatch_onAccountsUpdated = new ThunderDispatcher<OnAccountsUpdated, '__onAccountsUpdated'>('__onAccountsUpdated');

class ModuleFE_Account_v3_Class
	extends ModuleFE_v3_BaseApi<DBProto_AccountType>
	implements ApiDefCaller<ApiStructFE_AccountV3>, OnAuthRequiredListener {
	readonly vv1: ApiDefCaller<ApiStructFE_AccountV3>['vv1'];
	private status: LoggedStatus = LoggedStatus.VALIDATING;
	private accounts: UI_Account[] = [];
	accountId!: string;
	// @ts-ignore
	private sessionData!: TS_Object;

	constructor() {
		super(DBDef_v3_Accounts, dispatch_onAccountsUpdated);

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
		StorageKey_SessionId.delete();
		StorageKey_SessionTimeoutTimestamp.set(currentTimeMillis());
		return this.setLoggedStatus(LoggedStatus.SESSION_TIMEOUT);
	}

	getAccounts() {
		return this.accounts;
	}

	getLoggedStatus = () => this.status;

	isStatus = (status: LoggedStatus) => this.status === status;

	private onAccountCreated = async (response: DB_AccountV3) => {
		await this.onEntriesUpdated([response as DB_AccountV3]);
	};

	protected init(): void {
		ModuleFE_XHR.addDefaultHeader(HeaderKey_SessionId, () => StorageKey_SessionId.get());
		// ModuleFE_XHR.addDefaultHeader(HeaderKey_Email, () => StorageKey_UserEmail.get());

		const email = getQueryParameter(QueryParam_Email);
		const sessionId = getQueryParameter(QueryParam_SessionId);

		if (email && sessionId) {
			StorageKey_SessionId.set(String(sessionId));

			ModuleFE_BrowserHistory.removeQueryParam(QueryParam_Email);
			ModuleFE_BrowserHistory.removeQueryParam(QueryParam_SessionId);
		}

		const _sessionId = StorageKey_SessionId.get();
		if (_sessionId) {
			const now = currentTimeMillis();
			const sessionData = this.decode(_sessionId);
			if (!exists(sessionData.session.expiration) || now > sessionData.session.expiration)
				return this.setLoggedStatus(LoggedStatus.SESSION_TIMEOUT);

			this.accountId = sessionData.account._id;
			this.sessionData = sessionData;
			return this.setLoggedStatus(LoggedStatus.LOGGED_IN);
		}

		this.logDebug('login out user.... ');
		this.setLoggedStatus(LoggedStatus.LOGGED_OUT);
	}

	protected setLoggedStatus = (newStatus: LoggedStatus) => {
		if (this.status === newStatus)
			return;

		const pervStatus = this.status;
		this.status = newStatus;
		if (newStatus === LoggedStatus.LOGGED_IN || newStatus === LoggedStatus.LOGGED_OUT)
			StorageKey_SessionTimeoutTimestamp.delete();

		this.logInfo(`Login status changes: ${LoggedStatus[pervStatus]} => ${LoggedStatus[newStatus]}`);
		dispatch_onLoginStatusChanged.dispatchUI();
		dispatch_onLoginStatusChanged.dispatchModule();
	};

	private setLoginInfo = async (response: Response_Auth_V3) => {
		StorageKey_SessionId.set(response.sessionId);
		this.accountId = response._id;
		this.setLoggedStatus(LoggedStatus.LOGGED_IN);
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
		return StorageKey_SessionId.get('');
	};

	private decode(sessionData: string) {
		if (!sessionData.length)
			return;

		return JSON.parse(new TextDecoder('utf8').decode(ungzip(Uint8Array.from(atob(sessionData), c => c.charCodeAt(0)))));
	}

	logout = (url?: string) => {
		this.vv1.logout({}).execute();
		StorageKey_SessionId.delete();
		if (url)
			return window.location.href = url;

		this.setLoggedStatus(LoggedStatus.LOGGED_OUT);
	};
}

export const ModuleFE_AccountV2 = new ModuleFE_Account_v3_Class();