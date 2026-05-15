import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@nu-art/api-types';
import {AccountType, DatabaseDef_Account, DB_Account, UI_Account} from './types.js';
import {DB_BaseObject} from '@nu-art/db-api-shared';
import {DB_Session} from '../session/types.js';

export type Response_Auth = UI_Account & DB_BaseObject
export type AccountEmail = { email: string }
export type AccountEmailWithDevice = AccountEmail & { deviceId: string }
export type DBAccountType = { type: AccountType }

export type API_UserAccount = {
	refreshSession: QueryApi<void>;
	createAccount: BodyApi<UI_Account & DB_BaseObject, DBAccountType & AccountEmail>;
	logout: QueryApi<void>;
	createToken: BodyApi<{ token: string }, { accountId: DatabaseDef_Account['id'], ttl: number, label: string }>;
	getSessions: QueryApi<{ sessions: DB_Session[] }, DB_BaseObject<DatabaseDef_Account['dbKey']>>;
	changeThumbnail: BodyApi<{ account: DB_Account }, { accountId: DatabaseDef_Account['id']; hash: string }>;
	deleteAccount: QueryApi<{ account: DB_Account }, { accountId: DatabaseDef_Account['id'] }>;
}

export const ApiDef_UserAccount: ApiDefResolver<API_UserAccount> = {
	refreshSession: {method: HttpMethod.GET, path: '/v1/account/refresh-session'},
	createAccount: {method: HttpMethod.POST, path: '/v1/account/create-account'},
	logout: {method: HttpMethod.GET, path: '/v1/account/logout'},
	createToken: {method: HttpMethod.POST, path: '/v1/account/create-token'},
	getSessions: {method: HttpMethod.GET, path: '/v1/account/get-sessions'},
	changeThumbnail: {method: HttpMethod.POST, path: '/v1/account/change-thumbnail'},
	deleteAccount: {method: HttpMethod.GET, path: '/v1/account/delete-account'},
};
