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

import {ApiDefResolver, BodyApi, HttpMethod, QueryApi, QueryParams} from '@nu-art/thunderstorm';


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

export type Response_LoginSAML = {
	loginUrl: string
};

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

type TypedApi_LoginSaml = QueryApi<Response_LoginSAML, RequestParams_LoginSAML>;

export type ApiStruct_UserAccountFE = {
	v1: {
		create: BodyApi<Response_Auth, Request_CreateAccount>
		login: BodyApi<Response_Auth, Request_LoginAccount>
		loginSaml: TypedApi_LoginSaml
		validateSession: QueryApi<UI_Account, QueryParams, undefined>
		query: QueryApi<Response_ListAccounts>
	},
}

export type ApiStruct_UserAccountBE = {
	v1: {
		// addNew: BodyApi<UI_Account, Request_AddNewAccount>
		upsert: BodyApi<Response_Auth, Request_UpsertAccount>
		create: BodyApi<Response_Auth, Request_CreateAccount>
		login: BodyApi<Response_Auth, Request_LoginAccount>
		validateSession: QueryApi<UI_Account, QueryParams, undefined>
		query: QueryApi<Response_ListAccounts>
	}
}

export type ApiStruct_SAML_BE = {
	v1: {
		loginSaml: TypedApi_LoginSaml
		assertSAML: BodyApi<void, PostAssertBody>
	}
}

export const ApiDef_UserAccountFE: ApiDefResolver<ApiStruct_UserAccountFE> = {
	v1: {
		loginSaml: {method: HttpMethod.GET, path: '/v1/account/login-saml'},
		create: {method: HttpMethod.POST, path: '/v1/account/create'},
		login: {method: HttpMethod.POST, path: '/v1/account/login'},
		validateSession: {method: HttpMethod.GET, path: '/v1/account/validate'},
		query: {method: HttpMethod.GET, path: '/v1/account/query'},
	}
};

export const ApiDef_UserAccountBE: ApiDefResolver<ApiStruct_UserAccountBE> = {
	v1: {
		create: {method: HttpMethod.POST, path: '/v1/account/create'},
		login: {method: HttpMethod.POST, path: '/v1/account/login'},
		validateSession: {method: HttpMethod.GET, path: '/v1/account/validate'},
		query: {method: HttpMethod.GET, path: '/v1/account/query'},
		upsert: {method: HttpMethod.POST, path: '/v1/account/upsert'},
	}
};
export const ApiDef_SAML_BE: ApiDefResolver<ApiStruct_SAML_BE> = {
	v1: {
		loginSaml: {method: HttpMethod.GET, path: '/v1/account/login-saml'},
		assertSAML: {method: HttpMethod.POST, path: '/v1/account/assert'},
	}
};
