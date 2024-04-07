import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@nu-art/thunderstorm';
import {
	AccountEmail,
	AccountEmailWithDevice,
	DB_Session,
	PasswordWithCheck,
	Request_ChangeThumbnail,
	Request_LoginAccount,
	RequestBody_CreateToken,
	RequestBody_SetPassword,
	Response_ChangeThumbnail,
	Response_CreateToken
} from '../../../shared';
import {DB_BaseObject, Minute} from '@nu-art/ts-common';
import {AccountType, UI_Account} from './types';

//UTIL TYPES
type Response_Auth = UI_Account & DB_BaseObject
type AccountEmail = { email: string }
type AccountEmailWithDevice = AccountEmail & { deviceId: string }
type AccountPassword = { password: string }
type PasswordWithCheck = AccountPassword & { passwordCheck: string }
export type AccountToAssertPassword = AccountEmail & Partial<PasswordWithCheck>
export type AccountToSpice = AccountEmail & AccountPassword

//API Types
export type Account_RegisterAccount = {
	request: AccountEmailWithDevice & PasswordWithCheck;
	response: UI_Account & DB_BaseObject;
}

export type Account_CreateAccount = {
	request: { type: AccountType } & AccountEmail & Partial<PasswordWithCheck>;
	response: UI_Account & DB_BaseObject;
}

export type Account_ChangePassword = {
	request: PasswordWithCheck;
	response: Response_Auth;
}

export type Account_Logic = {
	request: AccountEmailWithDevice & AccountPassword;
	response: Response_Auth;
}

export type ApiStruct_Account = {
	_v1: {
		registerAccount: BodyApi<Account_RegisterAccount['response'], Account_RegisterAccount['request']>;
		refreshSession: QueryApi<void>;
		createAccount: BodyApi<Account_CreateAccount['response'], Account_CreateAccount['request']>;
		changePassword: BodyApi<Account_ChangePassword['response'], Account_ChangePassword['request']>;
		login: BodyApi<Account_Logic['response'], Account_Logic['request']>;
		logout: QueryApi<void, {}>;
		createToken: BodyApi<Response_CreateToken, RequestBody_CreateToken>;
		setPassword: BodyApi<Response_Auth, RequestBody_SetPassword>;
		getSessions: QueryApi<{ sessions: DB_Session[] }, DB_BaseObject>;
		changeThumbnail: BodyApi<Response_ChangeThumbnail, Request_ChangeThumbnail>;
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
	}
};