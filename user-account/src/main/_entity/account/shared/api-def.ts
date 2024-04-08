import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@nu-art/thunderstorm';
import {DB_Session, PasswordAssertionConfig} from '../../../shared';
import {DB_BaseObject, Minute, UniqueId} from '@nu-art/ts-common';
import {AccountType, DB_Account, UI_Account} from './types';
import {QueryParam_RedirectUrl} from '../../session/shared/consts';

//######################## Util Types ########################

export type Response_Auth = UI_Account & DB_BaseObject
export type AccountEmail = { email: string }
export type AccountEmailWithDevice = AccountEmail & { deviceId: string }
export type AccountPassword = { password: string }
export type PasswordWithCheck = AccountPassword & { passwordCheck: string }
export type DBAccountType = { type: AccountType }
export type AccountToAssertPassword = AccountEmail & Partial<PasswordWithCheck>
export type AccountToSpice = AccountEmail & AccountPassword
export type Request_RegisterAccount = DBAccountType & AccountEmailWithDevice & PasswordWithCheck

//######################## API Types - Account ########################

export type Account_RegisterAccount = {
	request: AccountEmailWithDevice & PasswordWithCheck;
	response: Response_Auth;
}

export type Account_CreateAccount = {
	request: DBAccountType & AccountEmail & Partial<PasswordWithCheck>;
	response: UI_Account & DB_BaseObject;
}

export type Account_ChangePassword = {
	request: PasswordWithCheck & { oldPassword: string };
	response: Response_Auth;
}

export type Account_Login = {
	request: AccountEmailWithDevice & AccountPassword;
	response: Response_Auth;
}

export type Account_CreateToken = {
	request: { accountId: UniqueId, ttl: number, label: string };
	response: { token: string };
}

export type Account_SetPassword = {
	request: PasswordWithCheck;
	response: Response_Auth;
}

export type Account_GetSessions = {
	request: DB_BaseObject;
	response: { sessions: DB_Session[] };
};

export type Account_ChangeThumbnail = {
	request: { accountId: string; hash: string };
	response: { account: DB_Account };
}

export type Account_GetPasswordAssertionConfig = {
	request: void;
	response: { config: PasswordAssertionConfig | undefined };
}

//######################## API Struct and Def - Account ########################

export type ApiStruct_Account = {
	_v1: {
		registerAccount: BodyApi<Account_RegisterAccount['response'], Account_RegisterAccount['request']>;
		refreshSession: QueryApi<void>;
		createAccount: BodyApi<Account_CreateAccount['response'], Account_CreateAccount['request']>;
		changePassword: BodyApi<Account_ChangePassword['response'], Account_ChangePassword['request']>;
		login: BodyApi<Account_Login['response'], Account_Login['request']>;
		logout: QueryApi<void>;
		createToken: BodyApi<Account_CreateToken['response'], Account_CreateToken['request']>;
		setPassword: BodyApi<Account_SetPassword['response'], Account_SetPassword['request']>;
		getSessions: QueryApi<Account_GetSessions['response'], Account_GetSessions['request']>;
		changeThumbnail: BodyApi<Account_ChangeThumbnail['response'], Account_ChangeThumbnail['request']>;
		getPasswordAssertionConfig: QueryApi<Account_GetPasswordAssertionConfig['response']>
	}
}

export const ApiDef_Account: ApiDefResolver<ApiStruct_Account> = {
	_v1: {
		registerAccount: {method: HttpMethod.POST, path: '/v1/account/register-account'},
		refreshSession: {method: HttpMethod.GET, path: '/v1/account/refresh-session'},
		createAccount: {method: HttpMethod.POST, path: '/v1/account/create-account'},
		changePassword: {method: HttpMethod.POST, path: '/v1/account/change-password'},
		login: {method: HttpMethod.POST, path: 'v1/account/login', timeout: Minute},
		logout: {method: HttpMethod.GET, path: 'v1/account/logout'},
		createToken: {method: HttpMethod.POST, path: 'v1/account/create-token', timeout: Minute},
		setPassword: {method: HttpMethod.POST, path: '/v1/account/set-password'},
		getSessions: {method: HttpMethod.GET, path: 'v1/account/get-sessions'},
		changeThumbnail: {method: HttpMethod.POST, path: '/v1/account/change-thumbnail'},
		getPasswordAssertionConfig: {method: HttpMethod.GET, path: '/v1/account/get-password-assertion-config'}
	}
};

//######################## API Types - SAML ########################

export type SAML_Login = {
	request: {
		[QueryParam_RedirectUrl]: string
		deviceId: string
	};
	response: { loginUrl: string };
}

export type SAML_Assert = {
	request: { RelayState: string };
	response: void;
}

//######################## API Struct and Def - SAML ########################

export type ApiStruct_SAML = {
	_v1: {
		loginSaml: QueryApi<SAML_Login['response'], SAML_Login['request']>
		assertSAML: BodyApi<SAML_Assert['response'], SAML_Assert['request']>
	}
}

export const ApiDef_SAML: ApiDefResolver<ApiStruct_SAML> = {
	_v1: {
		loginSaml: {method: HttpMethod.GET, path: 'v1/account/login-saml'},
		assertSAML: {method: HttpMethod.POST, path: 'v1/account/assert'}
	}
};