/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@nu-art/api-types';
import {Minute, PreDB, StringMap} from '@nu-art/ts-common';
import {DatabaseDef_Account} from '@nu-art/user-account-shared';
import {
	DatabaseDef_PermissionGroup,
	DatabaseDef_PermissionProject,
	DatabaseDef_PermissionUser,
	DB_PermissionProject,
} from './_entity.js';

export type UserUrlsPermissions = {
	[url: string]: boolean
}

export type Request_AssertApiForUser = {
	projectId: DatabaseDef_PermissionProject['id'];
	path: string
}

export type Request_UserUrlsPermissions = {
	projectId: DatabaseDef_PermissionProject['id'];
	urls: UserUrlsPermissions
}

export type Request_UserCFsByShareGroups = {
	groupsIds: DatabaseDef_PermissionGroup['id'][];
}

export type Request_UsersCFsByShareGroups = Request_UserCFsByShareGroups & {
	usersEmails: string[]
}

export type Response_UsersCFsByShareGroups = {
	[userEmail: string]: StringMap[]
}

export type Request_AssignAppPermissions<T extends StringMap = StringMap> = {
	projectId: DatabaseDef_PermissionProject['id'],
	groupsToRemove: PredefinedGroup[],
	group: PredefinedGroup,
	customField: T
	assertKeys?: (keyof T)[],
	customKey: string,
	sharedUserIds?: string[],
	appAccountId?: string
}

// export type Request_ConnectDomainToRoutes = {
// 	domainId: UniqueId;
// 	dbName: string;
// }

export type AssignAppPermissions = Request_AssignAppPermissions & { granterUserId: DatabaseDef_Account['id'] };

export type PredefinedGroup = { _id: DatabaseDef_PermissionGroup['id'], key: string, label: string, customKeys?: string[] };

export type PredefinedUser = { accountId: DatabaseDef_Account['id'], _id: DatabaseDef_PermissionUser['id'], groups: PredefinedGroup[] };

export type Request_RegisterProject = {
	project: PreDB<DB_PermissionProject>,
	routes: string[];
	predefinedGroups?: PredefinedGroup[]
	predefinedUser?: PredefinedUser
};

export type Response_User = {
	userId: DatabaseDef_Account['id'];
};

// ModuleBE_PermissionUser: see _entity/permission-user/api-def.ts for API_PermissionUser and ApiDef_PermissionUser.

// ModuleBE_PermissionsAssert
export type API_PermissionsAssert = {
	assertUserPermissions: BodyApi<Response_User, Request_AssertApiForUser>;
};
export const ApiDef_PermissionsAssert: ApiDefResolver<API_PermissionsAssert> = {
	assertUserPermissions: {method: HttpMethod.POST, path: 'v1/permissions/assert-user-access'}
};

// ModuleBE_Permissions
export type API_Permissions = {
	toggleStrictMode: QueryApi<void>;
	createProject: QueryApi<void>;
};
export const ApiDef_Permissions: ApiDefResolver<API_Permissions> = {
	toggleStrictMode: {method: HttpMethod.GET, path: 'v1/permissions/toggle-strict-mode', timeout: Minute},
	createProject: {method: HttpMethod.GET, path: 'v1/permissions/create-first-project', timeout: Minute},
};