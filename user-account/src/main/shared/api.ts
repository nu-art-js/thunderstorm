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

import {ApiDef, ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@nu-art/thunderstorm';


export const HeaderKey_SessionId = 'x-session-id';
export const HeaderKey_Email = 'x-email';

export const QueryParam_Email = 'userEmail';
export const QueryParam_SessionId = HeaderKey_SessionId;
export const QueryParam_RedirectUrl = 'redirectUrl';
export const HeaderKey_CurrentPage = 'current-page';

export type DB_Session = {
	userId: string
	sessionId: string
	timestamp: number
}

export type Response_Auth = {
	sessionId: string
	email: string
}

export type Request_UpsertAccount = {
	email: string
	password: string
	password_check: string
}

export type Request_CreateAccount = {
	email: string
	password: string
	password_check: string
	// customProps?: StringMap
}

export type Request_AddNewAccount = {
	email: string
	password?: string
	password_check?: string
}

export type Request_LoginAccount = {
	email: string
	password: string
}

export type Request_ValidateSession = {
	sessionId: string
}

export type Response_LoginSAML = {
	loginUrl: string
};

export type Response_Validation = UI_Account

export type UI_Account = { email: string; _id: string }

export type Response_ListAccounts = {
	accounts: UI_Account[]
};

export type RequestParams_LoginSAML = {
	[QueryParam_RedirectUrl]: string
};

export type PostAssertBody = {
	SAMLResponse: string
	RelayState: string
};

export type ApiStruct_UserAccount = {
	v1: {
		addNew: BodyApi<UI_Account, Request_AddNewAccount>

	},
}

export const ApiDef_LiveDoc: ApiDefResolver<ApiStruct_UserAccount> = {
	v1: {
		addNew: {method: HttpMethod.POST, path: '/v1/account/add-new'},
	}
};

export const ApiDef_UserAccount_Create: ApiDef<BodyApi<Response_Auth, Request_CreateAccount>> = {//'/v1/account/create'
	method: HttpMethod.POST,
	pathPrefix: '/v1/account',
	path: 'create'
};
export const ApiDef_UserAccount_Upsert: ApiDef<BodyApi<Response_Auth, Request_UpsertAccount>> = {//'/v1/account/upsert'
	method: HttpMethod.POST,
	pathPrefix: '/v1/account',
	path: 'upsert'
};
export const ApiDef_UserAccount_Login: ApiDef<BodyApi<Response_Auth, Request_LoginAccount>> = {//'/v1/account/login'
	method: HttpMethod.POST,
	pathPrefix: '/v1/account',
	path: 'login'
};
export const ApiDef_UserAccount_LoginSAML: ApiDef<QueryApi<Response_LoginSAML, RequestParams_LoginSAML>> = {//"/v1/account/login-saml"
	method: HttpMethod.GET,
	pathPrefix: '/v1/account',
	path: 'login-saml'
};
export const ApiDef_UserAccount_ValidateSession: ApiDef<QueryApi<Response_Validation>> = {//'/v1/account/validate'
	method: HttpMethod.GET,
	pathPrefix: '/v1/account',
	path: 'validate'
};
export const ApiDef_UserAccount_AssertLoginSAML: ApiDef<BodyApi<void, PostAssertBody>> = {//"/v1/account/assert"
	method: HttpMethod.POST,
	pathPrefix: '/v1/account',
	path: 'assert'
};
export const ApiDef_UserAccount_ListAccounts: ApiDef<QueryApi<Response_ListAccounts>> = {//'/v1/account/query'
	method: HttpMethod.GET,
	pathPrefix: '/v1/account',
	path: 'query'
};
