/*
 * ts-common is the basic building blocks of our typescript projects
 *
 * Copyright (C) 2020 Intuition Robotics
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

import {
	ApiWithBody,
	ApiWithQuery
} from "@ir/thunderstorm";
import {StringMap} from "@ir/ts-common";
import {DB_PermissionProject} from "./manager-types";
import {User_Group} from "./assign-types";


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

export type AssignAppPermissions = Request_AssignAppPermissions & {granterUserId: string};

export type PredefinedGroup = { _id: string, key: string, label: string, customKeys?: string[] };

export type PredefinedUser = { accountId: string, _id: string, groups: PredefinedGroup[] };

export type Request_RegisterProject = {
	project: DB_PermissionProject,
	routes: string[];
	predefinedGroups?: PredefinedGroup[]
	predefinedUser?: PredefinedUser
};

export type Response_User = {
	userId: string;
};

export type PermissionsApi_AssignAppPermissions = ApiWithBody<"/v1/permissions/assign/app-permissions", Request_AssignAppPermissions, void>;
export type PermissionsApi_ShareWithUser = ApiWithBody<"/v1/permissions/share-with-user", Request_AssignAppPermissions, void>;
export type PermissionsApi_VerifyPermissionsGrantingAllowed = ApiWithBody<"/v1/permissions/verify-permissions-granting-allowed", User_Group, void>;

export type PermissionsApi_AssertUserAccess = ApiWithBody<"/v1/permissions/assert-user-access", Request_AssertApiForUser, Response_User>;
export type PermissionsApi_UserUrlsPermissions = ApiWithBody<"/v1/permissions/user-urls-permissions", Request_UserUrlsPermissions, UserUrlsPermissions>;
export type PermissionsApi_UserCFsByShareGroups = ApiWithBody<"/v1/user-custom-fields/user-cf-by-share-groups", Request_UserCFsByShareGroups, StringMap[]>;


export type PermissionsApi_RegisterExternalProject = ApiWithBody<"/v1/register/register-external-project", Request_RegisterProject, void>;
export type PermissionsApi_RegisterProject = ApiWithQuery<"/v1/register/register-project", void>;
export type PermissionsApi_TestPermissions = ApiWithQuery<"/test/test-permissions", void>;

