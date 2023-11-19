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

import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@nu-art/thunderstorm';
import {Minute, PreDB, StringMap, UniqueId} from '@nu-art/ts-common';
import {DB_PermissionProject} from './management';


export type UserUrlsPermissions = {
	[url: string]: boolean
}

export type Request_AssertApiForUser = {
	projectId: string
	path: string
}

export type Request_UserUrlsPermissions = {
	projectId: string
	urls: UserUrlsPermissions
}

export type Request_UserCFsByShareGroups = {
	groupsIds: string[]
}

export type Request_UsersCFsByShareGroups = Request_UserCFsByShareGroups & {
	usersEmails: string[]
}

export type Response_UsersCFsByShareGroups = {
	[userEmail: string]: StringMap[]
}

export type Request_AssignAppPermissions<T extends StringMap = StringMap> = {
	projectId: string,
	groupsToRemove: PredefinedGroup[],
	group: PredefinedGroup,
	customField: T
	assertKeys?: (keyof T)[],
	customKey: string,
	sharedUserIds?: string[],
	appAccountId?: string
}

export type Request_ConnectDomainToRoutes = {
	domainId: UniqueId;
	dbName: string;
}

export type AssignAppPermissions = Request_AssignAppPermissions & { granterUserId: string };

export type PredefinedGroup = { _id: string, key: string, label: string, customKeys?: string[] };

export type PredefinedUser = { accountId: string, _id: string, groups: PredefinedGroup[] };

export type Request_RegisterProject = {
	project: PreDB<DB_PermissionProject>,
	routes: string[];
	predefinedGroups?: PredefinedGroup[]
	predefinedUser?: PredefinedUser
};

export type Response_User = {
	userId: string;
};

//ModuleBE_PermissionUser
export type _ApiStruct_PermissionsUser = {
	pah: {
		assignAppPermissions: BodyApi<void, Request_AssignAppPermissions>;
	}
}
export const _ApiDef_PermissionUser: ApiDefResolver<_ApiStruct_PermissionsUser> = {
	pah: {
		assignAppPermissions: {method: HttpMethod.POST, path: '/v1/permissions/assign/app-permissions'}
	}
};

//ModuleBE_PermissionsAssert
export type ApiStruct_PermissionsAssert = {
	vv1: {
		assertUserPermissions: BodyApi<Response_User, Request_AssertApiForUser>;
	}
}
export const ApiDef_PermissionsAssert: ApiDefResolver<ApiStruct_PermissionsAssert> = {
	vv1: {
		assertUserPermissions: {method: HttpMethod.POST, path: 'v1/permissions/assert-user-access'}
	}
};

//ModuleBE_Permissions
export type ApiStruct_Permissions = {
	v1: {
		// getUserUrlsPermissions: BodyApi<UserUrlsPermissions, Request_UserUrlsPermissions>;
		// getUserCFsByShareGroups: BodyApi<StringMap[], Request_UserCFsByShareGroups>;
		// getUsersCFsByShareGroups: BodyApi<Response_UsersCFsByShareGroups, Request_UsersCFsByShareGroups>;
		// registerExternalProject: BodyApi<void, Request_RegisterProject>;
		// registerProject: QueryApi<void>;
		toggleStrictMode: QueryApi<void>;
		createProject: QueryApi<void>;
		connectDomainToRoutes: BodyApi<void, Request_ConnectDomainToRoutes>
	}
}
export const ApiDef_Permissions: ApiDefResolver<ApiStruct_Permissions> = {
	v1: {
		// getUserUrlsPermissions: {method: HttpMethod.POST, path: 'v1/permissions/user-urls-permissions'},
		// getUserCFsByShareGroups: {method: HttpMethod.POST, path: 'v1/user-custom-fields/user-cf-by-share-groups'},
		// getUsersCFsByShareGroups: {method: HttpMethod.POST, path: 'v1/user-custom-fields/users-cf-by-share-groups'},
		// registerExternalProject: {method: HttpMethod.POST, path: 'v1/register/register-external-project'},
		// registerProject: {method: HttpMethod.GET, path: 'v1/register/register-project'},
		toggleStrictMode: {method: HttpMethod.GET, path: 'v1/permissions/toggle-strict-mode', timeout: Minute},
		createProject: {method: HttpMethod.GET, path: 'v1/permissions/create-first-project', timeout: Minute},
		connectDomainToRoutes: {method: HttpMethod.POST, path: 'v1/permissions/connect-domain-to-routes'},
	}
};