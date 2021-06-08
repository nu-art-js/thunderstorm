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

import {ApiCaller_PermissionsUser} from "../modules/assign/ApiCaller_PermissionsUser";
import {ApiCaller_PermissionsGroup} from "../modules/assign/ApiCaller_PermissionsGroup";
import {ApiCaller_PermissionsProject} from "../modules/manage/ApiCaller_PermissionsProject";
import {ApiCaller_PermissionsDomain} from "../modules/manage/ApiCaller_PermissionsDomain";
import {ApiCaller_PermissionsAccessLevel} from "../modules/manage/ApiCaller_PermissionsLevel";
import {ApiCaller_PermissionsApi} from "../modules/manage/ApiCaller_PermissionsApi";
import {ApiCaller_PermissionsTags} from "../modules/tags/ApiCaller_PermissionsTags";

export const Frontend_ModulePack_Permissions = [
	ApiCaller_PermissionsUser,
	ApiCaller_PermissionsGroup,
	ApiCaller_PermissionsProject,
	ApiCaller_PermissionsDomain,
	ApiCaller_PermissionsAccessLevel,
	ApiCaller_PermissionsApi,
	ApiCaller_PermissionsTags
];

export * from "../modules/assign/ApiCaller_PermissionsUser"
export * from "../modules/assign/ApiCaller_PermissionsGroup"
export * from "../modules/manage/ApiCaller_PermissionsProject"
export * from "../modules/manage/ApiCaller_PermissionsDomain"
export * from "../modules/manage/ApiCaller_PermissionsLevel"
export * from "../modules/manage/ApiCaller_PermissionsApi"
export * from "../modules/tags/ApiCaller_PermissionsTags"
