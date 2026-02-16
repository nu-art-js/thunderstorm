import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@nu-art/api-types';
import {DB_BaseObject, Minute, UniqueId} from '@nu-art/ts-common';
import {AccountType, DB_Account, UI_Account} from './types.js';
import {DB_Session, QueryParam_RedirectUrl} from '../session/index.js';
import {PasswordAssertionConfig} from '../../_enum/password-assertion/index.js';

export type Response_Auth = UI_Account & DB_BaseObject
export type AccountEmail = { email: string }
export type AccountEmailWithDevice = AccountEmail & { deviceId: string }
export type AccountPassword = { password: string }
export type PasswordWithCheck = AccountPassword & { passwordCheck: string }
export type DBAccountType = { type: AccountType }
export type AccountToAssertPassword = AccountEmail & Partial<PasswordWithCheck>
export type AccountToSpice = AccountEmail & AccountPassword
export type Request_RegisterAccount = DBAccountType & AccountEmailWithDevice & PasswordWithCheck

export type API_UserAccount = {
	registerAccount: BodyApi<Response_Auth, AccountEmailWithDevice & PasswordWithCheck>;
	refreshSession: QueryApi<void>;
	createAccount: BodyApi<UI_Account & DB_BaseObject, DBAccountType & AccountEmail & Partial<PasswordWithCheck>>;
	changePassword: BodyApi<Response_Auth, PasswordWithCheck & { oldPassword: string }>;
	login: BodyApi<Response_Auth, AccountEmailWithDevice & AccountPassword>;
	logout: QueryApi<void>;
	createToken: BodyApi<{ token: string }, { accountId: UniqueId, ttl: number, label: string }>;
	setPassword: BodyApi<Response_Auth, PasswordWithCheck>;
	getSessions: QueryApi<{ sessions: DB_Session[] }, DB_BaseObject>;
	changeThumbnail: BodyApi<{ account: DB_Account }, { accountId: string; hash: string }>;
	getPasswordAssertionConfig: QueryApi<{ config: PasswordAssertionConfig | undefined }>;
}

export const ApiDef_UserAccount: ApiDefResolver<API_UserAccount> = {
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
};

export type API_SAML = {
	loginSaml: QueryApi<{ loginUrl: string }, { [QueryParam_RedirectUrl]: string, deviceId: string }>;
	assertSAML: BodyApi<void, { RelayState: string }>;
}

export const ApiDef_SAML: ApiDefResolver<API_SAML> = {
	loginSaml: {method: HttpMethod.GET, path: 'v1/account/login-saml'},
	assertSAML: {method: HttpMethod.POST, path: 'v1/account/assert'}
};