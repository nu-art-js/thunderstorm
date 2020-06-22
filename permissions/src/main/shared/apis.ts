/*
 * ts-common is the basic building blocks of our typescript projects
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

import {
	ApiWithBody,
	ApiWithQuery
} from "@nu-art/thunderstorm";
import {StringMap} from "@nu-art/ts-common";
import {DB_PermissionProject} from "./manager-types";


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

export type Request_AssignAppPermissions = {
	projectId: string,
	groupsToRemove: PredefinedGroup[],
	group: PredefinedGroup,
	userId: string
	customField: StringMap
}


export type PredefinedGroup = { _id: string, label: string };

export type Request_RegisterProject = {
	project: DB_PermissionProject,
	routes: string[];
	predefinedGroups?: PredefinedGroup[]
};

export type Response_User = {
	userId: string;
};

export type PermissionsApi_AssignAppPermissions = ApiWithBody<"/v1/permissions/assert/app-permissions", Request_AssignAppPermissions, void>;

export type PermissionsApi_AssertUserAccess = ApiWithBody<"/v1/permissions/assert-user-access", Request_AssertApiForUser, Response_User>;
export type PermissionsApi_UserUrlsPermissions = ApiWithBody<"/v1/permissions/user-urls-permissions", Request_UserUrlsPermissions, UserUrlsPermissions>;


export type PermissionsApi_RegisterExternalProject = ApiWithBody<"/v1/register/register-external-project", Request_RegisterProject, void>;
export type PermissionsApi_RegisterProject = ApiWithQuery<"/v1/register/register-project", void>;
export type PermissionsApi_TestPermissions = ApiWithQuery<"/test/test-permissions", void>;

