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
import {apiWithQuery,} from '@nu-art/thunderstorm/frontend';
import {ApiDef_Permissions} from '../..';
import {PermissionKey_FE} from '../PermissionKey_FE';
import {SessionKey_Permissions_FE, SessionKey_StrictMode_FE} from '../consts';


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
	permissionKeys: TypedMap<PermissionKey_FE<any>> = {};
	readonly v1;

	constructor() {
		super();

		this.v1 = {
			toggleStrictMode: apiWithQuery(ApiDef_Permissions.v1.toggleStrictMode),
			createProject: apiWithQuery(ApiDef_Permissions.v1.createProject),
		};
	}

	getAccessLevelByKeyString(key: string) {
		return this.getAccessLevel(this.getPermissionKey(key));
	}

	getAccessLevel(key: PermissionKey_FE): AccessLevel {
		const keyData = key.get();
		if (!exists(keyData))
			return SessionKey_StrictMode_FE.get() ? AccessLevel.Undefined : AccessLevel.HasAccess;

		if (keyData.accessLevelIds.length === 0)
			return AccessLevel.NoAccessLevelsDefined;

		const userAccessLevels = SessionKey_Permissions_FE.get();
		try {
			const canAccess = _keys(keyData._accessLevels).reduce((hasAccess, domainId) => {
				return hasAccess && userAccessLevels[domainId] >= keyData._accessLevels[domainId];
			}, true);
			return canAccess ? AccessLevel.HasAccess : AccessLevel.NoAccess;
		} catch (e) {
			return AccessLevel.NoAccess;
		}
	}

	getPermissionKey(key: string): PermissionKey_FE {
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