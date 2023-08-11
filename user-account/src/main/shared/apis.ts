import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@nu-art/thunderstorm';
import {Minute, UniqueId} from '@nu-art/ts-common';
import {AccountType, UI_Account} from './types';
import {AccountTypeV3, DB_AccountV3} from './v3-types';


export const HeaderKey_SessionId = 'x-session-id';
export const HeaderKey_Application = 'x-application';
export const HeaderKey_Email = 'x-email';

export const QueryParam_Email = 'userEmail';
export const QueryParam_SessionId = HeaderKey_SessionId;
export const QueryParam_RedirectUrl = 'redirectUrl';
export const HeaderKey_CurrentPage = 'current-page';

export type Request_RegisterAccount = {
	email: string
	password: string
	password_check: string
	type: AccountType
	// customProps?: StringMap
}

export type Response_Auth = UI_Account & {
	sessionId: string
}

export type Response_Auth_V3 = DB_AccountV3 & {
	sessionId: string
}

export type RequestBody_RegisterAccount = {
	email: string
	password: string
	password_check: string
};

export type Request_CreateAccount = {
	email: string
	type: AccountType
	password?: string
	password_check?: string
};

export type Request_CreateAccountV3 = {
	email: string
	type: AccountTypeV3
	password?: string
	password_check?: string
};


export type ResponseBody_CreateAccount = UI_Account;


export type RequestBody_ValidateSession = {}
export type ResponseBody_ValidateSession = {}

export type RequestBody_ChangePassword = {
	userEmail: string, originalPassword: string, newPassword: string, newPassword_check: string
}
export type ResponseBody_ChangePassword = Response_Auth & {}
export type ResponseBody_ChangePassword_V3 = Response_Auth_V3 & {}

export type RequestBody_SetPassword = {
	userEmail: string,
	password: string,
	password_check: string;
}

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
export type RequestBody_CreateToken = { accountId: UniqueId, ttl: number };
export type Response_CreateToken = { token: string };

type TypedApi_LoginSaml = { loginSaml: QueryApi<Response_LoginSAML, RequestParams_LoginSAML> };
type TypedApi_Login = { login: BodyApi<Response_Auth, Request_LoginAccount> };
type TypedApi_Login_V3 = { login: BodyApi<Response_Auth_V3, Request_LoginAccount> };
type TypedApi_Logout = { logout: QueryApi<void, {}> };
type TypedAPI_RegisterAccount = { registerAccount: BodyApi<Response_Auth, RequestBody_RegisterAccount> };
type TypedAPI_RegisterAccount_V3 = { registerAccount: BodyApi<Response_Auth_V3, RequestBody_RegisterAccount> };
type TypedApi_CreateAccount = { createAccount: BodyApi<UI_Account, Request_CreateAccount> };
type TypedApi_CreateAccount_V3 = { createAccount: BodyApi<DB_AccountV3, Request_CreateAccount> };
type TypedApi_ChangedPassword = { changePassword: BodyApi<ResponseBody_ChangePassword, RequestBody_ChangePassword> };
type TypedApi_ChangedPassword_V3 = { changePassword: BodyApi<ResponseBody_ChangePassword_V3, RequestBody_ChangePassword> };
type TypedApi_CreateToken = { createToken: BodyApi<Response_CreateToken, RequestBody_CreateToken> };
type TypedApi_SetPassword = { setPassword: BodyApi<Response_Auth, RequestBody_SetPassword> };
type TypedApi_SetPassword_V3 = { setPassword: BodyApi<Response_Auth_V3, RequestBody_SetPassword> };

const API_LoginSaml = {loginSaml: {method: HttpMethod.GET, path: 'v1/account-v2/login-saml'}} as const;
const API_Login = {login: {method: HttpMethod.POST, path: 'v1/account-v2/login', timeout: Minute}} as const;
const API_CreateToken = {createToken: {method: HttpMethod.POST, path: 'v1/account-v2/create-token', timeout: Minute}} as const;
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
const API_SetPassword = {setPassword: {method: HttpMethod.POST, path: '/v1/account-v2/set-password'}} as const;

export type ApiStructBE_Account_V3 = {
	vv1: TypedAPI_RegisterAccount_V3
		& TypedApi_CreateAccount_V3
		& TypedApi_Login_V3
		& TypedApi_Logout
		& TypedApi_ChangedPassword_V3
		& TypedApi_CreateToken
		& TypedApi_SetPassword_V3
}

export type ApiStructBE_Account = {
	vv1: TypedAPI_RegisterAccount
		& TypedApi_CreateAccount
		& TypedApi_Login
		& TypedApi_Logout
		& TypedApi_ChangedPassword
		& TypedApi_CreateToken
		& TypedApi_SetPassword
}


export const ApiDefBE_AccountV3: ApiDefResolver<ApiStructBE_Account_V3> = {
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

export const ApiDefBE_AccountV2: ApiDefResolver<ApiStructBE_Account> = {
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
		& TypedApi_ChangedPassword
		& TypedApi_Login
		& TypedApi_Logout
		& TypedApi_LoginSaml
		& TypedApi_CreateToken
		& TypedApi_SetPassword
}

export type ApiStructFE_AccountV3 = {
	vv1: TypedAPI_RegisterAccount_V3
		& TypedApi_CreateAccount_V3
		& TypedApi_Login_V3
		& TypedApi_Logout
		& TypedApi_ChangedPassword_V3
		& TypedApi_CreateToken
		& TypedApi_SetPassword_V3
		& TypedApi_LoginSaml
}

export const ApiDefFE_AccountV3: ApiDefResolver<ApiStructFE_AccountV3> = {
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
