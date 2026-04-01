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

import {Module} from '@nu-art/ts-common';
import {SessionKey_Permissions_FE} from '../consts.js';
import type {PermissionScope} from '@nu-art/permissions-shared';

export interface OnPermissionsChanged {
	__onPermissionsChanged: () => void;
}

export class ModuleFE_PermissionsAssert_Class
	extends Module {

	hasScopeAccess(scope: PermissionScope, requiredValue: string): boolean {
		const sessionData = SessionKey_Permissions_FE.get();
		const prefix = scope.key + ':';
		const entry = sessionData.scopeEntries?.find(p => p.startsWith(prefix));
		if (!entry)
			return false;

		const userValue = entry.substring(prefix.length);
		const requiredIdx = scope.values.indexOf(requiredValue);
		const userIdx = scope.values.indexOf(userValue);
		return userIdx >= requiredIdx;
	}
}

export const ModuleFE_PermissionsAssert = new ModuleFE_PermissionsAssert_Class();
