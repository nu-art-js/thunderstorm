import {
	apiWithBody,
	apiWithQuery,
	getQueryParameter,
	ModuleFE_BrowserHistory,
	ModuleFE_v3_BaseApi,
	ModuleFE_XHR,
	ThunderDispatcher
} from '@nu-art/thunderstorm/frontend';
import {ApiDefCaller, BaseHttpRequest} from '@nu-art/thunderstorm';
import {ungzip} from 'pako';
import {
	BadImplementationException,
	cloneObj,
	composeUrl,
	currentTimeMillis, DB_BaseObject,
	exists,
	TS_Object,
	TypedKeyValue
} from '@nu-art/ts-common';
import {OnAuthRequiredListener} from '@nu-art/thunderstorm/shared/no-auth-listener';
import {
	ApiDefFE_Account,
	ApiStructFE_Account,
	DB_Account,
	DBDef_Accounts,
	DBProto_AccountType,
	HeaderKey_SessionId,
	QueryParam_Email,
	QueryParam_SessionId,
	Response_Auth,
	Response_LoginSAML,
	UI_Account
} from '../../shared';
import {StorageKey_SessionId, StorageKey_SessionTimeoutTimestamp} from '../core/consts';
import {ApiCallerEventType} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';

export interface OnLoginStatusUpdated {
	__onLoginStatusUpdated: () => void;
}

export interface OnAccountsUpdated {
	__onAccountsUpdated: (...params: ApiCallerEventType<DB_Account>) => void;
}

export enum LoggedStatus {
	VALIDATING,
	LOGGED_OUT,
	SESSION_TIMEOUT,
	LOGGED_IN
}

export const dispatch_onLoginStatusChanged = new ThunderDispatcher<OnLoginStatusUpdated, '__onLoginStatusUpdated'>('__onLoginStatusUpdated');
export const dispatch_onAccountsUpdated = new ThunderDispatcher<OnAccountsUpdated, '__onAccountsUpdated'>('__onAccountsUpdated');

class ModuleFE_Account_Class
	extends ModuleFE_v3_BaseApi<DBProto_AccountType>
	implements ApiDefCaller<ApiStructFE_Account>, OnAuthRequiredListener {
	readonly vv1: ApiDefCaller<ApiStructFE_Account>['vv1'];
	private status: LoggedStatus = LoggedStatus.VALIDATING;
	accountId!: string;
	// @ts-ignore
	private sessionData!: TS_Object;

	constructor() {
		super(DBDef_Accounts, dispatch_onAccountsUpdated);

		this.vv1 = {
			registerAccount: apiWithBody(ApiDefFE_Account.vv1.registerAccount, this.setLoginInfo),
			createAccount: apiWithBody(ApiDefFE_Account.vv1.createAccount, this.onAccountCreated),
			changePassword: apiWithBody(ApiDefFE_Account.vv1.changePassword),
			login: apiWithBody(ApiDefFE_Account.vv1.login, this.setLoginInfo),
			loginSaml: apiWithQuery(ApiDefFE_Account.vv1.loginSaml, this.onLoginCompletedSAML),
			logout: apiWithQuery(ApiDefFE_Account.vv1.logout),
			createToken: apiWithBody(ApiDefFE_Account.vv1.createToken),
			setPassword: apiWithBody(ApiDefFE_Account.vv1.setPassword),
		};
	}

	__onAuthRequiredListener(request: BaseHttpRequest<any>) {
		StorageKey_SessionId.delete();
		StorageKey_SessionTimeoutTimestamp.set(currentTimeMillis());
		return this.setLoggedStatus(LoggedStatus.SESSION_TIMEOUT);
	}

	getAccounts() {
		return this.cache.all().map(i => cloneObj(i)) as UI_Account[];
	}

	getLoggedStatus = () => this.status;

	isStatus = (status: LoggedStatus) => this.status === status;

	private onAccountCreated = async (response: UI_Account & DB_BaseObject) => {
		await this.onEntriesUpdated([response as DB_Account]);
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
		if (_sessionId)
			return this.processSessionStatus(_sessionId);

		this.logDebug('login out user.... ');
		this.setLoggedStatus(LoggedStatus.LOGGED_OUT);
	}

	private processSessionStatus(sessionId: string) {
		const now = currentTimeMillis();
		const sessionData = this.decode(sessionId);
		if (!exists(sessionData.session.expiration) || now > sessionData.session.expiration)
			return this.setLoggedStatus(LoggedStatus.SESSION_TIMEOUT);

		this.accountId = sessionData.account._id;
		this.sessionData = sessionData;
		return this.setLoggedStatus(LoggedStatus.LOGGED_IN);
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
		this.processSessionStatus(response.sessionId);
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

export class SessionKey_FE<Binder extends TypedKeyValue<string | number, any>> {
	private readonly key: Binder['key'];

	constructor(key: Binder['key']) {
		this.key = key;
	}

	get(): Binder['value'] {
		// @ts-ignore
		const sessionData = ModuleFE_Account.sessionData;
		// if (!sessionData)
		// 	return undefined;

		if (!(this.key in sessionData))
			throw new BadImplementationException(`Couldn't find key ${this.key} in session data`);

		return sessionData[this.key] as Binder['value'];
	}
}

export const ModuleFE_Account = new ModuleFE_Account_Class();