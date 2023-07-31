import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@nu-art/thunderstorm';
import {DB_BaseObject, Minute, PreDB} from '@nu-art/ts-common';
import {AccountType, UI_Account} from './types';


export const HeaderKey_SessionId = 'x-session-id';
export const HeaderKey_Application = 'x-application';
export const HeaderKey_Email = 'x-email';

export const QueryParam_Email = 'userEmail';
export const QueryParam_SessionId = HeaderKey_SessionId;
export const QueryParam_RedirectUrl = 'redirectUrl';
export const HeaderKey_CurrentPage = 'current-page';

export type Request_CreateAccount = {
	email: string
	password: string
	password_check: string
	type: AccountType
	// customProps?: StringMap
}

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

export type RequestParams_LoginSAML = {
	[QueryParam_RedirectUrl]: string
};

export type Response_LoginSAML = {
	loginUrl: string
};

export type Request_LoginAccount = {
	email: string
	password: string
}

type TypedApi_LoginSaml = { loginSaml: QueryApi<Response_LoginSAML, RequestParams_LoginSAML> };
type TypedApi_Login = { login: BodyApi<Response_Auth, Request_LoginAccount> };
type TypedApi_Logout = { logout: QueryApi<void, {}> };
type TypedAPI_RegisterAccount = { registerAccount: BodyApi<Response_Auth, RequestBody_CreateAccount> };
type TypedApi_CreateAccount = { createAccount: BodyApi<UI_Account, PreDB<UI_Account> & { password?: string }> };
type TypedApi_ChangedPassword = { changePassword: BodyApi<ResponseBody_ChangePassword, RequestBody_ChangePassword> };
type TypedApi_ListAccounts = { listAccounts: QueryApi<{ accounts: UI_Account[] }> };
type TypedApi_CreateToken = { createToken: QueryApi<{ token: string }, DB_BaseObject & { ttlMs: number }> };

const API_LoginSaml = {loginSaml: {method: HttpMethod.GET, path: 'v1/account-v2/login-saml'}} as const;
const API_Login = {login: {method: HttpMethod.POST, path: 'v1/account-v2/login', timeout: Minute}} as const;
const API_ListAccounts = {listAccounts: {method: HttpMethod.GET, path: 'v1/account-v2/list-accounts', timeout: Minute}} as const;
const API_CreateToken = {createToken: {method: HttpMethod.GET, path: 'v1/account-v2/create-token', timeout: Minute}} as const;
const API_Logout = {logout: {method: HttpMethod.GET, path: 'v1/account-v2/logout'}} as const;
const API_RegisterAccount = {registerAccount: {method: HttpMethod.POST, path: '/v1/account-v2/register-account'}} as const;
const API_CreateAccount = {createAccount: {method: HttpMethod.POST, path: '/v1/account-v2/create-account'}} as const;
const API_ValidateSession = {
	validateSession: {
		method: HttpMethod.GET,
		path: 'v1/account-v2/validate',
		timeout: Minute
	}
} as const;
const API_ChangePassword = {changePassword: {method: HttpMethod.POST, path: '/v1/account-v2/change-password'}} as const;

export type ApiStructBE_Account = {
	vv1: TypedAPI_RegisterAccount
		& TypedApi_CreateAccount
		& TypedApi_Login
		& TypedApi_Logout
		& TypedApi_ChangedPassword
		& TypedApi_ListAccounts
		& TypedApi_CreateToken
}

export const ApiDefBE_AccountV2: ApiDefResolver<ApiStructBE_Account> = {
	vv1: {
		...API_RegisterAccount,
		...API_CreateAccount,
		...API_ChangePassword,
		...API_Login,
		...API_Logout,
		...API_ValidateSession,
		...API_ListAccounts,
		...API_CreateToken,
	}
};

export type ApiStructFE_Account = {
	vv1: TypedAPI_RegisterAccount
		& TypedApi_CreateAccount
		& TypedApi_ChangedPassword
		& TypedApi_Login
		& TypedApi_Logout
		& TypedApi_LoginSaml
		& TypedApi_ListAccounts
		& TypedApi_CreateToken
}

export const ApiDefFE_Account: ApiDefResolver<ApiStructFE_Account> = {
	vv1: {
		...API_RegisterAccount,
		...API_CreateAccount,
		...API_ChangePassword,
		...API_Login,
		...API_LoginSaml,
		...API_Logout,
		...API_ValidateSession,
		...API_ListAccounts,
		...API_CreateToken,
	}
};

export type PostAssertBody = {
	SAMLResponse: string
	RelayState: string
};

export type ApiStruct_SAML_BE = {
	vv1: TypedApi_LoginSaml & {
		assertSAML: BodyApi<void, PostAssertBody>
	}
}

export const ApiDef_SAML_BE: ApiDefResolver<ApiStruct_SAML_BE> = {
	vv1: {
		...API_LoginSaml,
		assertSAML: {method: HttpMethod.POST, path: 'v1/account/assert'},
	}
};
