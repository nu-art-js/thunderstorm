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
import {stringToUniqueId} from '@nu-art/db-api-shared';
import type {ServerApi_Middleware} from '@nu-art/http-server';
import {CollectSessionData, SessionKey_Account_BE} from '@nu-art/user-account-backend';
import {DatabaseDef_PermissionUser, DatabaseDef_UserPermissions, SessionData_StrictMode} from '@nu-art/permissions-shared';
import {MemKey_UserAccessIds, MemKey_UserEntityContexts, MemKey_UserScopePermissions} from '../consts.js';
import type {PermissionScope} from '@nu-art/permissions-shared';
import type {PermissionAssertionContext} from '../assertion-types.js';
import {ModuleBE_UserPermissionsDB} from '../_entity/user-permissions/ModuleBE_UserPermissionsDB.js';
import {ModuleBE_PermissionUserDB} from '../_entity/permission-user/ModuleBE_PermissionUserDB.js';

type Config = {
	strictMode?: boolean
}

export class ModuleBE_PermissionsAssert_Class
	extends Module<Config>
	implements CollectSessionData<SessionData_StrictMode> {

	readonly LoadPermissionsMiddleware: ServerApi_Middleware = async () => {
		const account = SessionKey_Account_BE.get();

		const permissionsId = stringToUniqueId<DatabaseDef_UserPermissions['dbKey']>(account._id);
		const entity = await ModuleBE_UserPermissionsDB.query.unique(permissionsId);
		MemKey_UserScopePermissions.set(entity?.scopeEntries ?? []);

		const permissionUserId = stringToUniqueId<DatabaseDef_PermissionUser['dbKey']>(account._id);
		const permissionUser = await ModuleBE_PermissionUserDB.query.unique(permissionUserId);
		const roleIds = permissionUser?.roles.map(r => r.roleId) ?? [];
		MemKey_UserAccessIds.set([permissionUserId, ...roleIds]);
	};

	async __collectSessionData(): Promise<SessionData_StrictMode> {
		return {key: 'strictMode', value: {isStrictMode: !!this.config?.strictMode}};
	}

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

	createAssertionContext(): PermissionAssertionContext {
		const userPerms = MemKey_UserScopePermissions.get();
		const entityContexts = MemKey_UserEntityContexts.get();

		return {
			hasScope: (scope: PermissionScope, value: string): boolean => {
				const prefix = scope.key + ':';
				const entry = userPerms.find(p => p.startsWith(prefix));
				if (!entry)
					return false;

				const userValue = entry.substring(prefix.length);
				const requiredIdx = scope.values.indexOf(value);
				if (requiredIdx === -1)
					return false;

				const userIdx = scope.values.indexOf(userValue);
				return userIdx >= requiredIdx;
			},

			ownsEntity: async (pointer) => {
				return entityContexts.some(ctx => ctx.dbKey === pointer.dbKey && ctx.id === pointer.id);
			},

			and: async (...predicates) => {
				const results = await Promise.all(predicates);
				return results.every(r => r);
			},

			or: async (...predicates) => {
				const results = await Promise.all(predicates);
				return results.some(r => r);
			},
		};
	}
}

export const ModuleBE_PermissionsAssert = new ModuleBE_PermissionsAssert_Class();
