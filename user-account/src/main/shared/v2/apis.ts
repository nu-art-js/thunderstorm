import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@nu-art/thunderstorm';
import {PostAssertBody, Request_LoginAccount, RequestParams_LoginSAML, Response_LoginSAML, UI_Account} from '../api';
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

type TypedApi_LoginSaml = { loginSaml: QueryApi<Response_LoginSAML, RequestParams_LoginSAML> };
type TypedApi_Login = { login: BodyApi<Response_Auth, Request_LoginAccount> };
type TypedApi_Logout = { logout: QueryApi<void, {}> };
type TypedAPI_RegisterAccount = { registerAccount: BodyApi<ResponseBody_CreateAccount, RequestBody_CreateAccount> };
type TypedApi_CreateAccount = { createAccount: BodyApi<ResponseBody_CreateAccount, RequestBody_CreateAccount> };
type TypedApi_ValidateSession = { validateSession: QueryApi<UI_Account, {}> };
type TypedApi_ChangedPassword = { changePassword: BodyApi<ResponseBody_ChangePassword, RequestBody_ChangePassword> };

const API_LoginSaml = {loginSaml: {method: HttpMethod.GET, path: 'v1/account/login-saml'}} as const;
const API_Login = {login: {method: HttpMethod.POST, path: 'v1/account/login', timeout: Minute}} as const;
const API_Logout = {logout: {method: HttpMethod.GET, path: 'v1/account/logout'}} as const;
const API_RegisterAccount = {registerAccount: {method: HttpMethod.POST, path: '/v1/account/register-account'}} as const;
const API_CreateAccount = {createAccount: {method: HttpMethod.POST, path: '/v1/account/create-account'}} as const;
const API_ValidateSession = {
	validateSession: {
		method: HttpMethod.GET,
		path: 'v1/account/validate',
		timeout: Minute
	}
} as const;
const API_ChangePassword = {changePassword: {method: HttpMethod.POST, path: '/v1/account/change-password'}} as const;

export type ApiStructBE_Account = {
	vv1: TypedAPI_RegisterAccount
		& TypedApi_CreateAccount
		& TypedApi_Login
		& TypedApi_Logout
		& TypedApi_ValidateSession
		& TypedApi_ChangedPassword
}

export const ApiDefBE_Account: ApiDefResolver<ApiStructBE_Account> = {
	vv1: {
		...API_RegisterAccount,
		...API_CreateAccount,
		...API_ChangePassword,
		...API_Login,
		...API_Logout,
		...API_ValidateSession,
	}
};

export type ApiStructFE_Account = {
	v1: TypedAPI_RegisterAccount
		& TypedApi_CreateAccount
		& TypedApi_ChangedPassword
		& TypedApi_Login
		& TypedApi_Logout
		& TypedApi_ValidateSession
		& TypedApi_LoginSaml
}

export const ApiDefFE_Account: ApiDefResolver<ApiStructFE_Account> = {
	v1: {
		...API_RegisterAccount,
		...API_CreateAccount,
		...API_ChangePassword,
		...API_Login,
		...API_Logout,
		...API_ValidateSession,
		...API_LoginSaml,
	}
};

export type ApiStruct_SAML_BE = {
	v1: TypedApi_LoginSaml & {
		assertSAML: BodyApi<void, PostAssertBody>
	}
}

export const ApiDef_SAML_BE: ApiDefResolver<ApiStruct_SAML_BE> = {
	v1: {
		...API_LoginSaml,
		assertSAML: {method: HttpMethod.POST, path: 'v1/account/assert'},
	}
};