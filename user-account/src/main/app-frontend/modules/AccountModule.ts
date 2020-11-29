/*
 * Permissions management system, define access level for each of 
 * your server apis, and restrict users by giving them access levels
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

import {
	Module,
	Second
} from "@nu-art/ts-common";
import {
	BaseComponent,
	BrowserHistoryModule,
	HttpModule,
	StorageKey,
	ThunderDispatcher,
	ToastModule
} from "@nu-art/thunderstorm/frontend";
import {
	AccountApi_Create,
	AccountApi_ListAccounts,
	AccountApi_Login,
	AccountApi_LoginSAML,
	AccountApi_ValidateSession,
	HeaderKey_SessionId,
	QueryParam_Email,
	QueryParam_SessionId,
	Request_CreateAccount,
	Request_LoginAccount,
	RequestParams_LoginSAML,
	Response_Auth,
	Response_ListAccounts,
	Response_LoginSAML,
	UI_Account
} from "../../shared/api";
import {HttpMethod} from "@nu-art/thunderstorm";

export const StorageKey_SessionId: StorageKey<string> = new StorageKey<string>(`storage-${HeaderKey_SessionId}`);
export const StorageKey_UserEmail: StorageKey<string> = new StorageKey<string>(`storage-${QueryParam_Email}`);


export const RequestKey_AccountCreate = "account-create";
export const RequestKey_AccountLogin = "account-login";
export const RequestKey_AccountLoginSAML = "account-login-saml";
export const RequestKey_ValidateSession = "account-validate";

export interface OnLoginStatusUpdated {
	onLoginStatusUpdated: () => void;
}

export enum LoggedStatus {
	VALIDATING,
	LOGGED_OUT,
	LOGGED_IN
}

type Config = {}

export interface OnAccountsLoaded {
	__onAccountsLoaded: () => void;
}

const dispatch_onAccountsLoaded = new ThunderDispatcher<OnAccountsLoaded, "__onAccountsLoaded">("__onAccountsLoaded");

export class AccountModule_Class
	extends Module<Config> {

	private status: LoggedStatus = LoggedStatus.VALIDATING;
	private dispatchUI_loginChanged!: ThunderDispatcher<OnLoginStatusUpdated, "onLoginStatusUpdated">;
	private accounts: UI_Account[] = [];

	constructor() {
		super();
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
		this.logInfo(`Login status changes: ${LoggedStatus[pervStatus]} => ${LoggedStatus[newStatus]}`);
		this.dispatchUI_loginChanged.dispatchUI([]);
		this.dispatchUI_loginChanged.dispatchModule([]);
	};


	protected init(): void {
		HttpModule.addDefaultHeader(HeaderKey_SessionId, () => StorageKey_SessionId.get());
		// HttpModule.addDefaultHeader(HeaderKey_Email, () => StorageKey_UserEmail.get());

		this.dispatchUI_loginChanged = new ThunderDispatcher<OnLoginStatusUpdated, "onLoginStatusUpdated">("onLoginStatusUpdated");
		const email = BaseComponent.getQueryParameter(QueryParam_Email);
		const sessionId = BaseComponent.getQueryParameter(QueryParam_SessionId);

		if (email && sessionId) {
			StorageKey_SessionId.set(sessionId);
			StorageKey_UserEmail.set(email);

			BrowserHistoryModule.removeQueryParam(QueryParam_Email);
			BrowserHistoryModule.removeQueryParam(QueryParam_SessionId);
		}

		if (StorageKey_SessionId.get())
			return this.validateToken();

		this.logDebug("login out user.... ");
		this.setLoggedStatus(LoggedStatus.LOGGED_OUT)
	}

	public create(request: Request_CreateAccount) {
		HttpModule
			.createRequest<AccountApi_Create>(HttpMethod.POST, RequestKey_AccountCreate)
			.setRelativeUrl("/v1/account/create")
			.setJsonBody(request)
			.setLabel(`User register...`)
			.setOnError("Error registering user")
			.execute(async (response: Response_Auth) => {
				this.setLoginInfo(response);
			});
	}

	public login(request: Request_LoginAccount) {
		HttpModule
			.createRequest<AccountApi_Login>(HttpMethod.POST, RequestKey_AccountLogin)
			.setRelativeUrl("/v1/account/login")
			.setJsonBody(request)
			.setLabel(`User login with password...`)
			.setOnError("Error login user")
			.execute(async (response: Response_Auth) => {
				this.setLoginInfo(response);
			});
	}

	private setLoginInfo(response: Response_Auth) {
		StorageKey_SessionId.set(response.sessionId);
		StorageKey_UserEmail.set(response.email);
		this.setLoggedStatus(LoggedStatus.LOGGED_IN);
	}

	public loginSAML(request: RequestParams_LoginSAML) {
		HttpModule
			.createRequest<AccountApi_LoginSAML>(HttpMethod.GET, RequestKey_AccountLoginSAML)
			.setRelativeUrl("/v1/account/login-saml")
			.setUrlParams(request)
			.setLabel(`User login SAML...`)
			.setOnError('Error login user')
			.execute(async (response: Response_LoginSAML) => {
				if (!response.loginUrl)
					return;

				window.location.href = response.loginUrl;
			});
	}

	private validateToken = () => {
		HttpModule
			.createRequest<AccountApi_ValidateSession>(HttpMethod.GET, RequestKey_ValidateSession)
			.setLabel(`Validate token...`)
			.setRelativeUrl("/v1/account/validate")
			.setOnError((request, resError) => {
				if (request.xhr.status === 0) {
					ToastModule.toastError("Cannot reach Server... trying in 30 sec");
					setTimeout(() => this.validateToken(), 30 * Second);
					return;
				}


				StorageKey_SessionId.delete();
				return this.setLoggedStatus(LoggedStatus.LOGGED_OUT);
			})
			.execute(async () => {
				this.setLoggedStatus(LoggedStatus.LOGGED_IN);
			});
	};

	logout = (url?: string) => {
		StorageKey_SessionId.delete();
		if(url)
			return window.location.href = url;

		this.setLoggedStatus(LoggedStatus.LOGGED_OUT);
	};

	listUsers = () => {
		HttpModule
			.createRequest<AccountApi_ListAccounts>(HttpMethod.GET, RequestKey_ValidateSession)
			.setLabel(`Fetching users...`)
			.setRelativeUrl("/v1/account/query")
			.execute(async (res: Response_ListAccounts) => {
				this.accounts = res.accounts.filter(account => account._id);
				dispatch_onAccountsLoaded.dispatchUI([]);
			});

	}
}

export const AccountModule = new AccountModule_Class();
