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

import {ApiException, Module} from '@nu-art/ts-common';
import type {ServerApi_Middleware} from '@nu-art/http-server';
import {CollectSessionData} from '@nu-art/user-account-backend';
import {SessionData_StrictMode} from '@nu-art/permissions-shared';
import {MemKey_UserScopePermissions, SessionKey_Permissions_BE} from '../consts.js';
import type {PermissionScope} from '@nu-art/permissions-shared';

type Config = {
	strictMode?: boolean
}

export class ModuleBE_PermissionsAssert_Class
	extends Module<Config>
	implements CollectSessionData<SessionData_StrictMode> {

	readonly LoadPermissionsMiddleware: ServerApi_Middleware = async () => {
		try {
			MemKey_UserScopePermissions.get();
		} catch (err) {
			const sessionData = SessionKey_Permissions_BE.get();
			MemKey_UserScopePermissions.set(sessionData.scopeEntries ?? []);
		}
	};

	async __collectSessionData(): Promise<SessionData_StrictMode> {
		return {key: 'strictMode', value: {isStrictMode: !!this.config?.strictMode}};
	}

	/**
	 * Asserts that the user has at least the required value for the given scope.
	 * Reads MemKey_UserScopePermissions (string[] of 'scopeKey:value' entries).
	 * Compares position in the scope's ordered values array.
	 */
	assertScopePermission(scope: PermissionScope, requiredValue: string): void {
		const userPerms = MemKey_UserScopePermissions.get();
		const prefix = scope.key + ':';
		const entry = userPerms.find(p => p.startsWith(prefix));
		if (!entry)
			throw new ApiException(403, `No access for scope: ${scope.key}`);

		const userValue = entry.substring(prefix.length);
		const requiredIdx = scope.values.indexOf(requiredValue);
		if (requiredIdx === -1)
			throw new ApiException(503, `Unknown permission value '${requiredValue}' for scope '${scope.key}'`);

		const userIdx = scope.values.indexOf(userValue);
		if (userIdx === -1 || userIdx < requiredIdx) {
			this.logErrorBold(`scope permission denied: ${scope.key} (has: ${userValue}, needs: ${requiredValue})`);
			throw new ApiException(403, `Insufficient access for scope: ${scope.key}`);
		}
	}
}

export const ModuleBE_PermissionsAssert = new ModuleBE_PermissionsAssert_Class();
