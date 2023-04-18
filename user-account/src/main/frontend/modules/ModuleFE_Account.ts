/*
 * User secured registration and login management system..
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {currentTimeMillis, Day, Hour, Module, Second} from '@nu-art/ts-common';
import {
	apiWithBody,
	apiWithQuery,
	getQueryParameter,
	ModuleFE_BrowserHistory,
	ModuleFE_Toaster,
	StorageKey,
	ThunderDispatcher,
	XhrHttpModule
} from '@nu-art/thunderstorm/frontend';
import {
	ApiDef_UserAccountFE,
	ApiStruct_UserAccountFE,
	HeaderKey_SessionId,
	QueryParam_Email,
	QueryParam_SessionId,
	Response_Auth,
	Response_ListAccounts,
	Response_LoginSAML,
	UI_Account
} from '../../shared/api';
import {ApiDefCaller, BaseHttpRequest} from '@nu-art/thunderstorm';
import {ungzip} from 'pako';


export const StorageKey_SessionId = new StorageKey<string>(`storage-${HeaderKey_SessionId}`);
export const StorageKey_SessionTimeoutTimestamp = new StorageKey<number>(`storage-accounts__session-timeout`);
export const StorageKey_UserEmail = new StorageKey<string>(`storage-${QueryParam_Email}`);

export const RequestKey_AccountCreate = 'account-create';
export const RequestKey_AccountLogin = 'account-login';
export const RequestKey_AccountLoginSAML = 'account-login-saml';
export const RequestKey_ValidateSession = 'account-validate';

export interface OnLoginStatusUpdated {
	__onLoginStatusUpdated: () => void;
}

export enum LoggedStatus {
	VALIDATING,
	LOGGED_OUT,
	SESSION_TIMEOUT,
	LOGGED_IN
}

type Config = {}

export interface OnAccountsLoaded {
	__onAccountsLoaded: () => void;
}

const dispatch_onAccountsLoaded = new ThunderDispatcher<OnAccountsLoaded, '__onAccountsLoaded'>('__onAccountsLoaded');
export const dispatch_onLoginStatusChanged = new ThunderDispatcher<OnLoginStatusUpdated, '__onLoginStatusUpdated'>('__onLoginStatusUpdated');

export class ModuleFE_Account_Class
	extends Module<Config>
	implements ApiDefCaller<ApiStruct_UserAccountFE> {

	private status: LoggedStatus = LoggedStatus.VALIDATING;
	private accounts: UI_Account[] = [];
	readonly v1: ApiDefCaller<ApiStruct_UserAccountFE>['v1'];
	accountId!: string;

	constructor() {
		super();

		const validateSession = apiWithQuery(ApiDef_UserAccountFE.v1.validateSession, this.onSessionValidated, this.onSessionValidationError);
		this.v1 = {
			create: apiWithBody(ApiDef_UserAccountFE.v1.create, this.setLoginInfo),
			login: apiWithBody(ApiDef_UserAccountFE.v1.login, this.setLoginInfo),
			logout: apiWithQuery(ApiDef_UserAccountFE.v1.logout),
			loginSaml: apiWithQuery(ApiDef_UserAccountFE.v1.loginSaml, this.onLoginCompletedSAML),
			validateSession: () => validateSession({}),
			query: apiWithQuery(ApiDef_UserAccountFE.v1.query, this.onAccountsQueryCompleted),
		};
	}

	getAccounts() {
		return this.accounts;
	}

	getLoggedStatus = () => this.status;

	isStatus = (status: LoggedStatus) => this.status === status;

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

	protected init(): void {
		XhrHttpModule.addDefaultHeader(HeaderKey_SessionId, () => StorageKey_SessionId.get());
		// XhrHttpModule.addDefaultHeader(HeaderKey_Email, () => StorageKey_UserEmail.get());

		const email = getQueryParameter(QueryParam_Email);
		const sessionId = getQueryParameter(QueryParam_SessionId);

		if (email && sessionId) {
			StorageKey_SessionId.set(String(sessionId));
			StorageKey_UserEmail.set(String(email));

			ModuleFE_BrowserHistory.removeQueryParam(QueryParam_Email);
			ModuleFE_BrowserHistory.removeQueryParam(QueryParam_SessionId);
		}

		if (StorageKey_SessionId.get()) {
			this.v1.validateSession().execute();
			return;
		}

		const now = currentTimeMillis();
		if (now - StorageKey_SessionTimeoutTimestamp.get(now + Day) < Hour)
			return this.setLoggedStatus(LoggedStatus.SESSION_TIMEOUT);

		this.logDebug('login out user.... ');
		this.setLoggedStatus(LoggedStatus.LOGGED_OUT);
	}

	private setLoginInfo = async (response: Response_Auth) => {
		StorageKey_SessionId.set(response.sessionId);
		StorageKey_UserEmail.set(response.email);
		this.accountId = response._id;
		this.setLoggedStatus(LoggedStatus.LOGGED_IN);
	};

	public getSessionId = (): string => {
		return this.isStatus(LoggedStatus.LOGGED_IN) ? StorageKey_SessionId.get() : '';
	};

	public decodeSessionData = () => {
		const sessionData = this.getSessionId();
		return JSON.parse(new TextDecoder('utf8').decode(ungzip(Uint8Array.from(atob(sessionData), c => c.charCodeAt(0)))));
	}

	private onLoginCompletedSAML = async (response: Response_LoginSAML) => {
		if (!response.loginUrl)
			return;

		window.location.href = response.loginUrl;
	};

	private onSessionValidated = async (uiAccount: UI_Account) => {
		this.accountId = uiAccount._id;
		this.setLoggedStatus(LoggedStatus.LOGGED_IN);
	};

	private onSessionValidationError = async (response: any, body: any, request: BaseHttpRequest<ApiStruct_UserAccountFE['v1']['validateSession']>) => {
		if (request.getStatus() === 0) {
			ModuleFE_Toaster.toastError('Cannot reach Server... trying in 30 sec');
			setTimeout(() => this.v1.validateSession().execute(), 30 * Second);
			return;
		}

		StorageKey_SessionId.delete();
		StorageKey_SessionTimeoutTimestamp.set(currentTimeMillis());
		return this.setLoggedStatus(LoggedStatus.SESSION_TIMEOUT);
	};

	logout = (url?: string) => {
		this.v1.logout({}).execute();
		StorageKey_SessionId.delete();
		if (url)
			return window.location.href = url;

		this.setLoggedStatus(LoggedStatus.LOGGED_OUT);
	};

	private onAccountsQueryCompleted = async (res: Response_ListAccounts) => {
		this.accounts = res.accounts.filter(account => account._id);
		dispatch_onAccountsLoaded.dispatchUI();
	};
}

export const ModuleFE_Account = new ModuleFE_Account_Class();
