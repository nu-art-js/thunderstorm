import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@nu-art/thunderstorm';
import {DB_BaseObject, Minute, UniqueId} from '@nu-art/ts-common';
import {AccountType, UI_Account} from './types';


export const HeaderKey_SessionId = 'x-session-id';
export const HeaderKey_Application = 'x-application';
export const HeaderKey_Email = 'x-email';

export const QueryParam_Email = 'userEmail';
export const QueryParam_SessionId = HeaderKey_SessionId;
export const QueryParam_RedirectUrl = 'redirectUrl';
export const HeaderKey_CurrentPage = 'current-page';

export type Response_Auth = UI_Account & DB_BaseObject

type DBAccountType = {
	type: AccountType
}

export type AccountEmail = {
	email: string
}
export type AccountEmailWithDevice = AccountEmail & {
	deviceId: string
}

export type AccountPassword = {
	password: string
}

export type PasswordWithCheck = AccountPassword & {
	passwordCheck: string
}

export type AccountToAssertPassword = AccountEmail & Partial<PasswordWithCheck>
export type AccountToSpice = AccountEmail & AccountPassword
export type Request_RegisterAccount = DBAccountType & AccountEmailWithDevice & PasswordWithCheck
export type RequestBody_RegisterAccount = AccountEmailWithDevice & PasswordWithCheck
export type Request_CreateAccount = DBAccountType & AccountEmail & Partial<PasswordWithCheck>
export type ResponseBody_ChangePassword = Response_Auth
export type RequestBody_SetPassword = PasswordWithCheck
export type RequestBody_Login = AccountEmailWithDevice & AccountPassword

export type RequestBody_ChangePassword = PasswordWithCheck & {
	oldPassword: string
}
export type RequestParams_LoginSAML = {
	[QueryParam_RedirectUrl]: string
	deviceId: string
};

export type Response_LoginSAML = {
	loginUrl: string
};

export type Request_LoginAccount = AccountEmailWithDevice & AccountPassword
export type RequestBody_CreateToken = { accountId: UniqueId, ttl: number };

export type Response_CreateToken = { token: string };

type TypedApi_LoginSaml = { loginSaml: QueryApi<Response_LoginSAML, RequestParams_LoginSAML> };
type TypedApi_Login = { login: BodyApi<Response_Auth, Request_LoginAccount> };
type TypedApi_Logout = { logout: QueryApi<void, {}> };
type TypedAPI_RegisterAccount = { registerAccount: BodyApi<Response_Auth, RequestBody_RegisterAccount> };
type TypedApi_CreateAccount = { createAccount: BodyApi<UI_Account & DB_BaseObject, Request_CreateAccount> };
type TypedApi_ChangedPassword = {
	changePassword: BodyApi<ResponseBody_ChangePassword, RequestBody_ChangePassword>
};
type TypedApi_CreateToken = { createToken: BodyApi<Response_CreateToken, RequestBody_CreateToken> };
type TypedApi_SetPassword = { setPassword: BodyApi<Response_Auth, RequestBody_SetPassword> };

const API_LoginSaml = {loginSaml: {method: HttpMethod.GET, path: 'v1/account/login-saml'}} as const;
const API_Login = {login: {method: HttpMethod.POST, path: 'v1/account/login', timeout: Minute}} as const;
const API_Logout = {logout: {method: HttpMethod.GET, path: 'v1/account/logout'}} as const;
const API_RegisterAccount = {
	registerAccount: {
		method: HttpMethod.POST,
		path: '/v1/account/register-account'
	}
} as const;
const API_CreateAccount = {createAccount: {method: HttpMethod.POST, path: '/v1/account/create-account'}} as const;
const API_ChangePassword = {
	changePassword: {
		method: HttpMethod.POST,
		path: '/v1/account/change-password'
	}
} as const;
const API_CreateToken = {
	createToken: {
		method: HttpMethod.POST,
		path: 'v1/account/create-token',
		timeout: Minute
	}
} as const;
const API_SetPassword = {setPassword: {method: HttpMethod.POST, path: '/v1/account/set-password'}} as const;
const API_ValidateSession = {
	validateSession: {
		method: HttpMethod.GET,
		path: 'v1/account/validate',
		timeout: Minute
	}
} as const;

export type ApiStructBE_Account = {
	vv1: TypedAPI_RegisterAccount
		& TypedApi_CreateAccount
		& TypedApi_Login
		& TypedApi_Logout
		& TypedApi_ChangedPassword
		& TypedApi_CreateToken
		& TypedApi_SetPassword
}

export const ApiDefBE_Account: ApiDefResolver<ApiStructBE_Account> = {
	vv1: {
		...API_RegisterAccount,
		...API_CreateAccount,
		...API_ChangePassword,
		...API_Login,
		...API_Logout,
		...API_ValidateSession,
		...API_CreateToken,
		...API_SetPassword,
	}
};

export type ApiStructFE_Account = {
	vv1: TypedAPI_RegisterAccount
		& TypedApi_CreateAccount
		& TypedApi_Login
		& TypedApi_Logout
		& TypedApi_ChangedPassword
		& TypedApi_CreateToken
		& TypedApi_SetPassword
		& TypedApi_LoginSaml
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
		...API_CreateToken,
		...API_SetPassword,
	}
};

export type RequestBody_AssertSAML = {
	RelayState: string
};

export type ApiStruct_SAML_BE = {
	vv1: TypedApi_LoginSaml & {
		assertSAML: BodyApi<void, RequestBody_AssertSAML>
	}
}

export const ApiDef_SAML_BE: ApiDefResolver<ApiStruct_SAML_BE> = {
	vv1: {
		...API_LoginSaml,
		assertSAML: {method: HttpMethod.POST, path: 'v1/account/assert'},
	}
};
