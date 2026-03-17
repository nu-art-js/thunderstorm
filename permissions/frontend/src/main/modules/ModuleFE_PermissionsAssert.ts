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
import {ApiCaller} from '@nu-art/http-client';
import {PermissionKey_FE} from '../PermissionKey_FE.js';
import {SessionKey_Permissions_FE, SessionKey_StrictMode_FE} from '../consts.js';
import {RendererKey_AccountMenu_SubHeader} from '@nu-art/user-account-frontend/consts';
import {Renderer_RoleNames} from '../ui/Renderer_RoleNames.js';
import {API_Permissions, ApiDef_Permissions} from '@nu-art/permissions-shared';
import {getRendererRegistry} from '../permissions-wire.js';


export type PermissionsModuleFEConfig = {
	projectId: string
}

export interface OnPermissionsChanged {
	__onPermissionsChanged: () => void;
}

export interface OnPermissionsFailed {
	__onPermissionsFailed: () => void;
}

export enum AccessLevel {
	Undefined,
	NoAccessLevelsDefined,
	NoAccess,
	HasAccess
}

export class ModuleFE_PermissionsAssert_Class
	extends Module<PermissionsModuleFEConfig> {
	permissionKeys: TypedMap<PermissionKey_FE<any>> = {};

	constructor() {
		super();
	}

	@ApiCaller(ApiDef_Permissions.toggleStrictMode)
	async toggleStrictMode(_params?: API_Permissions['toggleStrictMode']['Params']): Promise<API_Permissions['toggleStrictMode']['Response']> {
		void _params;
		return undefined as unknown as API_Permissions['toggleStrictMode']['Response'];
	}

	@ApiCaller(ApiDef_Permissions.createProject)
	async createProject(_params?: API_Permissions['createProject']['Params']): Promise<API_Permissions['createProject']['Response']> {
		void _params;
		return undefined as unknown as API_Permissions['createProject']['Response'];
	}

	protected init() {
		super.init();

		getRendererRegistry()?.registerRenderer(RendererKey_AccountMenu_SubHeader, Renderer_RoleNames);
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

		const userAccessLevels = SessionKey_Permissions_FE.get().domainToValueMap;
		const accessLevels = keyData._accessLevels ?? {};
		try {
			const canAccess = (Object.keys(accessLevels) as (keyof typeof accessLevels)[]).reduce((hasAccess, domainId) => {
				return hasAccess && userAccessLevels[domainId] >= accessLevels[domainId];
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