import {ApiDefResolver, BodyApi, HttpMethod, QueryApi, QueryParams} from '@nu-art/thunderstorm';
import {
	PostAssertBody,
	Request_CreateAccount,
	Request_LoginAccount,
	RequestParams_LoginSAML,
	Response_ListAccounts,
	Response_LoginSAML,
	UI_Account
} from '../api';
import {Minute} from '@nu-art/ts-common';

export type Response_Auth = UI_Account & {
	sessionId: string
}

export type RequestBody_CreateAccount = {
	email: string
	password: string
	password_check: string
};
export type ResponseBody_CreateAccount = {
	sessionId: string
};

export type RequestBody_ValidateSession = {}
export type ResponseBody_ValidateSession = {}

export type RequestBody_ChangePassword = {
	userEmail: string, originalPassword: string, newPassword: string, newPassword_check: string
}
export type ResponseBody_ChangePassword = Response_Auth & {}

type TypedApi_LoginSaml = QueryApi<Response_LoginSAML, RequestParams_LoginSAML>;


export type ApiStructBE_Account = {
	vv1: {
		registerAccount: BodyApi<ResponseBody_CreateAccount, RequestBody_CreateAccount>,
		createAccount: BodyApi<ResponseBody_CreateAccount, RequestBody_CreateAccount>,
		changePassword: BodyApi<ResponseBody_ChangePassword, RequestBody_ChangePassword>,
		login: BodyApi<Response_Auth, Request_LoginAccount>,
		logout: QueryApi<void, {}>,
	},
}

export const ApiDefBE_Account: ApiDefResolver<ApiStructBE_Account> = {
	vv1: {
		registerAccount: {method: HttpMethod.POST, path: '/v1/account/register-account'},
		createAccount: {method: HttpMethod.POST, path: '/v1/account/create-account'},
		changePassword: {method: HttpMethod.POST, path: '/v1/account/change-password'},
		login: {method: HttpMethod.POST, path: 'v1/account/login', timeout: Minute},
		logout: {method: HttpMethod.GET, path: 'v1/account/logout'},
	}
};

export type ApiStructFE_Account = {
	v1: {
		create: BodyApi<Response_Auth, Request_CreateAccount>
		login: BodyApi<Response_Auth, Request_LoginAccount>
		logout: QueryApi<{}, {}>
		loginSaml: TypedApi_LoginSaml
		validateSession: QueryApi<UI_Account, QueryParams, undefined>
		query: QueryApi<Response_ListAccounts>
	},
}

const API_LoginSaml = {loginSaml: {method: HttpMethod.GET, path: 'v1/account/login-saml'}} as const;

export const ApiDefFE_Account: ApiDefResolver<ApiStructFE_Account> = {
	v1: {
		...API_LoginSaml,
		create: {method: HttpMethod.POST, path: 'v1/account/create'},
		login: {method: HttpMethod.POST, path: 'v1/account/login', timeout: Minute},
		logout: {method: HttpMethod.GET, path: 'v1/account/logout'},
		validateSession: {method: HttpMethod.GET, path: 'v1/account/validate', timeout: Minute},
		query: {method: HttpMethod.GET, path: 'v1/account/query'},
	}
};

export type ApiStruct_SAML_BE = {
	v1: {
		loginSaml: TypedApi_LoginSaml
		assertSAML: BodyApi<void, PostAssertBody>
	}
}

export const ApiDef_SAML_BE: ApiDefResolver<ApiStruct_SAML_BE> = {
	v1: {
		...API_LoginSaml,
		assertSAML: {method: HttpMethod.POST, path: 'v1/account/assert'},
	}
};
