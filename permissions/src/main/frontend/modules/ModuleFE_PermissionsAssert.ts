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

import {_keys, BadImplementationException, exists, Module, TypedMap} from '@nu-art/ts-common';
import {apiWithBody, apiWithQuery,} from '@nu-art/thunderstorm/frontend';
import {ApiDefCaller} from '@nu-art/thunderstorm';
import {ApiDef_Permissions, ApiStruct_Permissions} from '../..';
import {ModuleFE_PermissionsApi} from './manage/ModuleFE_PermissionsApi';
import {PermissionKey_FE} from '../PermissionKey_FE';
import {SessionKey_Permissions_FE, SessionKey_StrictMode_FE} from '../consts';
import {ModuleFE_Account} from '@nu-art/user-account/frontend';
import {DefaultAccessLevel_Admin} from '../../shared/consts';


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

export class ModuleFE_PermissionsAssert_Class
	extends Module<PermissionsModuleFEConfig> {
	readonly v1: ApiDefCaller<ApiStruct_Permissions>['v1'];
	permissionKeys: TypedMap<PermissionKey_FE<any>> = {};

	constructor() {
		super();

		this.v1 = {
			createProject: apiWithQuery(ApiDef_Permissions.v1.createProject, this.onProjectCreated),
			connectDomainToRoutes: apiWithBody(ApiDef_Permissions.v1.connectDomainToRoutes, async () => await ModuleFE_PermissionsApi.v1.sync().executeSync())
		};
	}

	private onProjectCreated = async () => {
		ModuleFE_Account.logout();
		// await Promise.all([
		// 	ModuleFE_PermissionsProject,
		// 	ModuleFE_PermissionsApi,
		// 	ModuleFE_PermissionsDomain,
		// 	ModuleFE_PermissionsAccessLevel,
		// 	ModuleFE_PermissionsGroup,
		// 	ModuleFE_PermissionsUser,
		// ].map(async module => await module.v1.sync().executeSync()));
	};

	getAccessLevelByKeyString(key: string) {
		return this.getAccessLevel(this.getPermissionKey(key));
	}

	getAccessLevel(key: PermissionKey_FE<string>): AccessLevel {
		const keyData = key.get();
		if (!exists(keyData))
			return SessionKey_StrictMode_FE.get() ? AccessLevel.Undefined : AccessLevel.HasAccess;

		if (keyData.accessLevelIds.length === 0)
			return AccessLevel.NoAccessLevelsDefined;

		const userAccessLevels = SessionKey_Permissions_FE.get();

		const canAccess = _keys(keyData._accessLevels).reduce((hasAccess, domainId) => {
			return hasAccess && (userAccessLevels[domainId] || (SessionKey_StrictMode_FE.get() ? -1 : DefaultAccessLevel_Admin.value)) >= keyData._accessLevels[domainId];
		}, true);
		return canAccess ? AccessLevel.HasAccess : AccessLevel.NoAccess;
	}

	getPermissionKey(key: string) {
		return this.permissionKeys[key];
	}

	registerPermissionKey(key: PermissionKey_FE) {
		if (this.permissionKeys[key.key])
			throw new BadImplementationException(`Registered PermissionKey '${key}' more than once!`);
		this.permissionKeys[key.key] = key;
	}

	getAllPermissionKeys() {
		return this.permissionKeys;
	}
}

export const ModuleFE_PermissionsAssert = new ModuleFE_PermissionsAssert_Class();