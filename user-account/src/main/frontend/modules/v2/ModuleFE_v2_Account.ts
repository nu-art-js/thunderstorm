import {ApiCallerEventType, ModuleFE_BaseApi} from '@nu-art/db-api-generator/frontend';
import {
	ApiDefFE_Account,
	ApiStructFE_Account,
	DB_Account_V2,
	DBDef_Account,
	HeaderKey_SessionId,
	QueryParam_Email,
	QueryParam_SessionId,
	Response_Auth,
	Response_LoginSAML, ResponseBody_CreateAccount,
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
import {composeUrl, currentTimeMillis, TS_Object} from '@nu-art/ts-common';
import {OnAuthRequiredListener} from '@nu-art/thunderstorm/shared/no-auth-listener';


export const StorageKey_SessionId = new StorageKey<string>(`storage-${HeaderKey_SessionId}`);
export const StorageKey_SessionTimeoutTimestamp = new StorageKey<number>(`storage-accounts__session-timeout`);
export const StorageKey_UserEmail = new StorageKey<string>(`storage-${QueryParam_Email}`);

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

class ModuleFE_Account_v2_Class
	extends ModuleFE_BaseApi<DB_Account_V2, 'email'>
	implements ApiDefCaller<ApiStructFE_Account>, OnAuthRequiredListener {
	readonly vv1: ApiDefCaller<ApiStructFE_Account>['vv1'];
	private status: LoggedStatus = LoggedStatus.VALIDATING;
	private accounts: UI_Account[] = [];
	accountId!: string;
	sessionData?: TS_Object;

	constructor() {
		super(DBDef_Account, dispatch_onAccountsUpdated);

		this.vv1 = {
			registerAccount: apiWithBody(ApiDefFE_Account.vv1.registerAccount, this.setLoginInfo),
			createAccount: apiWithBody(ApiDefFE_Account.vv1.createAccount, this.onAccountCreated),
			changePassword: apiWithBody(ApiDefFE_Account.vv1.changePassword),
			login: apiWithBody(ApiDefFE_Account.vv1.login, this.setLoginInfo),
			loginSaml: apiWithQuery(ApiDefFE_Account.vv1.loginSaml, this.onLoginCompletedSAML),
			logout: apiWithQuery(ApiDefFE_Account.vv1.logout),
			createToken: apiWithQuery(ApiDefFE_Account.vv1.createToken),
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

	private onAccountCreated = async (response: ResponseBody_CreateAccount) => {
		await this.onEntriesUpdated([response as DB_Account_V2]);
	};

	protected init(): void {
		ModuleFE_XHR.addDefaultHeader(HeaderKey_SessionId, () => StorageKey_SessionId.get());
		// ModuleFE_XHR.addDefaultHeader(HeaderKey_Email, () => StorageKey_UserEmail.get());

		const email = getQueryParameter(QueryParam_Email);
		const sessionId = getQueryParameter(QueryParam_SessionId);

		if (email && sessionId) {
			StorageKey_SessionId.set(String(sessionId));
			StorageKey_UserEmail.set(String(email));

			ModuleFE_BrowserHistory.removeQueryParam(QueryParam_Email);
			ModuleFE_BrowserHistory.removeQueryParam(QueryParam_SessionId);
		}

		if (StorageKey_SessionId.get()) {
			const now = currentTimeMillis();
			const sessionData = this.decode(StorageKey_SessionId.get());

			if (now > sessionData.expiration)
				return this.setLoggedStatus(LoggedStatus.SESSION_TIMEOUT);

			this.sessionData = sessionData;
			this.accountId = sessionData.accountId;
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

	private setLoginInfo = async (response: Response_Auth) => {
		StorageKey_SessionId.set(response.sessionId);
		StorageKey_UserEmail.set(response.email);
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
		return this.isStatus(LoggedStatus.LOGGED_IN) ? StorageKey_SessionId.get() : '';
	};

	public decodeSessionData = () => {
		const sessionData = this.getSessionId();
		return this.decode(sessionData);
	};

	private decode(sessionData: string) {
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

export const ModuleFE_AccountV2 = new ModuleFE_Account_v2_Class();
