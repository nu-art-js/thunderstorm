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
import {PreDB, StringMap} from '@nu-art/ts-common';
import {DB_PermissionProject} from './management';


export type UserUrlsPermissions = {
	[url: string]: boolean
}

export type Request_AssertApiForUser = {
	projectId: string
	path: string
	requestCustomField: StringMap
}

export type Request_UserUrlsPermissions = {
	projectId: string
	urls: UserUrlsPermissions
	requestCustomField: StringMap
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
//
// export type PermissionsApi_AssignAppPermissions = BodyApi<'/v1/permissions/assign/app-permissions', Request_AssignAppPermissions, void>;
// export type PermissionsApi_ShareWithUser = BodyApi<'/v1/permissions/share-with-user', Request_AssignAppPermissions, void>;
// export type PermissionsApi_VerifyPermissionsGrantingAllowed = BodyApi<'/v1/permissions/verify-permissions-granting-allowed', User_Group, void>;

// export type PermissionsApi_AssertUserAccess = BodyApi<'/v1/permissions/assert-user-access', Request_AssertApiForUser, Response_User>;
// export type PermissionsApi_UserUrlsPermissions = BodyApi<'/v1/permissions/user-urls-permissions', Request_UserUrlsPermissions, UserUrlsPermissions>;
// export type PermissionsApi_UserCFsByShareGroups = BodyApi<'/v1/user-custom-fields/user-cf-by-share-groups', Request_UserCFsByShareGroups, StringMap[]>;
// export type PermissionsApi_UsersCFsByShareGroups = BodyApi<'/v1/user-custom-fields/users-cf-by-share-groups', Request_UsersCFsByShareGroups, Response_UsersCFsByShareGroups>;

// export type PermissionsApi_RegisterExternalProject = BodyApi<'/v1/register/register-external-project', Request_RegisterProject, void>;
// export type PermissionsApi_RegisterProject = QueryApi<'/v1/register/register-project', void>;
// export type PermissionsApi_TestPermissions = QueryApi<'/test/test-permissions', void>;

//ModuleBE_PermissionUser
export type ApiStruct_PermissionsUser = {
	v1: {
		assignAppPermissions: BodyApi<void, Request_AssignAppPermissions>;
	}
}
export const ApiDef_PermissionUser: ApiDefResolver<ApiStruct_PermissionsUser> = {
	v1: {
		assignAppPermissions: {method: HttpMethod.POST, path: '/v1/permissions/assign/app-permissions'}
	}
};

//ModuleBE_PermissionsAssert
export type ApiStruct_PermissionsAssert = {
	v1: {
		assertUserPermissions: BodyApi<Response_User, Request_AssertApiForUser>;
	}
}
export const ApiDef_PermissionsAssert: ApiDefResolver<ApiStruct_PermissionsAssert> = {
	v1: {
		assertUserPermissions: {method: HttpMethod.POST, path: '/v1/permissions/assert-user-access'}
	}
};

//ModuleBE_Permissions
export type ApiStruct_Permissions = {
	v1: {
		getUserUrlsPermissions: BodyApi<UserUrlsPermissions, Request_UserUrlsPermissions>;
		getUserCFsByShareGroups: BodyApi<StringMap[], Request_UserCFsByShareGroups>;
		getUsersCFsByShareGroups: BodyApi<Response_UsersCFsByShareGroups, Request_UsersCFsByShareGroups>;
		_registerProject: BodyApi<void, Request_RegisterProject>;
		registerProject: QueryApi<void>;
	}
}
export const ApiDef_Permissions: ApiDefResolver<ApiStruct_Permissions> = {
	v1: {
		getUserUrlsPermissions: {method: HttpMethod.POST, path: '/v1/permissions/user-urls-permissions'},
		getUserCFsByShareGroups: {method: HttpMethod.POST, path: '/v1/user-custom-fields/user-cf-by-share-groups'},
		getUsersCFsByShareGroups: {method: HttpMethod.POST, path: '/v1/user-custom-fields/users-cf-by-share-groups'},
		_registerProject: {method: HttpMethod.POST, path: '/v1/register/register-external-project'},
		registerProject: {method: HttpMethod.GET, path: '/v1/register/register-project'}
	}
};