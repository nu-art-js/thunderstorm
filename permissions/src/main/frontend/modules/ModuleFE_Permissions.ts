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

import {exists, Module} from '@nu-art/ts-common';
import {apiWithBody, apiWithQuery,} from '@nu-art/thunderstorm/frontend';
import {ApiDefCaller} from '@nu-art/thunderstorm';
import {ApiDef_Permissions, ApiStruct_Permissions} from '../..';
import {ModuleFE_PermissionsProject} from './manage/ModuleFE_PermissionsProject';
import {ModuleFE_PermissionsDomain} from './manage/ModuleFE_PermissionsDomain';
import {ModuleFE_PermissionsAccessLevel} from './manage/ModuleFE_PermissionsAccessLevel';
import {ModuleFE_PermissionsGroup} from './assign/ModuleFE_PermissionsGroup';
import {ModuleFE_PermissionsUser} from './assign/ModuleFE_PermissionsUser';
import {ModuleFE_PermissionsApi} from './manage/ModuleFE_PermissionsApi';
import {PermissionKey_FE} from '../PermissionKey_FE';
import {SessionKey_Permissions_FE} from '../consts';


export type PermissionsModuleFEConfig = {
	projectId: string
}

export interface OnPermissionsChanged {
	__onPermissionsChanged: () => void;
}

export interface OnPermissionsFailed {
	__onPermissionsFailed: () => void;
}

// const dispatch_onPermissionsChanged = new ThunderDispatcher<OnPermissionsChanged, '__onPermissionsChanged'>('__onPermissionsChanged');
// const dispatch_onPermissionsFailed = new ThunderDispatcher<OnPermissionsFailed, '__onPermissionsFailed'>('__onPermissionsFailed');
export enum AccessLevel {
	Undefined,
	NoAccessLevelsDefined,
	NoAccess,
	HasAccess
}

export class ModuleFE_Permissions_Class
	extends Module<PermissionsModuleFEConfig> {
	readonly v1: ApiDefCaller<ApiStruct_Permissions>['v1'];

	constructor() {
		super();

		this.v1 = {
			createProject: apiWithQuery(ApiDef_Permissions.v1.createProject, this.onProjectCreated),
			connectDomainToRoutes: apiWithBody(ApiDef_Permissions.v1.connectDomainToRoutes, async () => await ModuleFE_PermissionsApi.v1.sync().executeSync())
		};
	}

	private onProjectCreated = async () => {
		await ModuleFE_PermissionsProject.v1.sync().executeSync();
		await ModuleFE_PermissionsApi.v1.sync().executeSync();
		await ModuleFE_PermissionsDomain.v1.sync().executeSync();
		await ModuleFE_PermissionsAccessLevel.v1.sync().executeSync();
		await ModuleFE_PermissionsGroup.v1.sync().executeSync();
		await ModuleFE_PermissionsUser.v1.sync().executeSync();
	};

	canAccess(key: PermissionKey_FE<string>) {
		const keyData = key.get();
		if (!exists(keyData))
			return AccessLevel.Undefined;

		if (keyData.accessLevelIds.length === 0)
			return AccessLevel.NoAccessLevelsDefined;

		const userAccessLevels = SessionKey_Permissions_FE.get();
		const canAccess = keyData.accessLevelIds.reduce((hasAccess, levelId) => {
			const dbLevel = ModuleFE_PermissionsAccessLevel.cache.unique(levelId)!;
			return hasAccess && (userAccessLevels[dbLevel.domainId] || -1) >= keyData._accessLevels[dbLevel.domainId];
		}, true);

		return canAccess ? AccessLevel.HasAccess : AccessLevel.NoAccess;
	}
}

export const ModuleFE_Permissions = new ModuleFE_Permissions_Class();