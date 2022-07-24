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

import {DBDef, tsValidateOptionalId, tsValidateStringWithDashes, tsValidateUniqueId} from '@nu-art/db-api-generator';
import {tsValidateRange} from '@nu-art/ts-common';
import {DB_PermissionAccessLevel} from './types';


const Validator_PermissionAccessLevel = {
	_id: tsValidateOptionalId,
	domainId: tsValidateUniqueId,
	name: tsValidateStringWithDashes,
	value: tsValidateRange([[0, 1000]]),
	_audit: undefined
};

export const DBDef_PermissionAccessLevel: DBDef<DB_PermissionAccessLevel> = {
	validator: Validator_PermissionAccessLevel,
	dbName: 'permissions--level',
	entityName: 'permissions--level',
};