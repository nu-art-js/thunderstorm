import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@nu-art/api-types';
import {Minute} from '@nu-art/ts-common';
import {AccountEmail, UI_Account} from '@nu-art/user-account-shared';
import {DB_BaseObject} from '@nu-art/db-api-shared';
import {PasswordAssertionConfig} from './_enum/password-assertion/types.js';

export type AccountPassword = { password: string }
export type PasswordWithCheck = AccountPassword & { passwordCheck: string }
export type AccountToAssertPassword = AccountEmail & Partial<PasswordWithCheck>
export type AccountToSpice = AccountEmail & AccountPassword
export type AccountEmailWithDevice = AccountEmail & { deviceId: string }
export type Request_RegisterAccount = AccountEmailWithDevice & PasswordWithCheck
export type Response_PasswordAuth = UI_Account & DB_BaseObject
export type Request_PasswordResetRequest = AccountEmail;
export type Request_PasswordResetExecute = { token: string } & PasswordWithCheck;

export type API_PasswordAuth = {
	registerAccount: BodyApi<Response_PasswordAuth, Request_RegisterAccount>;
	login: BodyApi<Response_PasswordAuth, AccountEmailWithDevice & AccountPassword>;
	changePassword: BodyApi<Response_PasswordAuth, PasswordWithCheck & { oldPassword: string }>;
	setPassword: BodyApi<Response_PasswordAuth, PasswordWithCheck>;
	getPasswordAssertionConfig: QueryApi<{ config: PasswordAssertionConfig | undefined }>;
	requestReset: BodyApi<void, Request_PasswordResetRequest>;
	executeReset: BodyApi<void, Request_PasswordResetExecute>;
}

export const ApiDef_PasswordAuth: ApiDefResolver<API_PasswordAuth> = {
	registerAccount: {method: HttpMethod.POST, path: '/v1/auth/password/register'},
	login: {method: HttpMethod.POST, path: '/v1/auth/password/login', timeout: Minute},
	changePassword: {method: HttpMethod.POST, path: '/v1/auth/password/change-password'},
	setPassword: {method: HttpMethod.POST, path: '/v1/auth/password/set-password'},
	getPasswordAssertionConfig: {method: HttpMethod.GET, path: '/v1/auth/password/assertion-config'},
	requestReset: {method: HttpMethod.POST, path: '/v1/auth/password/request-reset'},
	executeReset: {method: HttpMethod.POST, path: '/v1/auth/password/execute-reset'},
};
