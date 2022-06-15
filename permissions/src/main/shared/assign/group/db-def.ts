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

import {DBDef, tsValidateStringAndNumbersWithDashes, tsValidateUniqueId} from '@nu-art/db-api-generator';
import {tsValidateArray, tsValidateObjectValues} from '@nu-art/ts-common';
import {DB_PermissionGroup} from './types';
import {validateCustomFieldValues, validateGroupLabel} from '../../validators';


const Validator_PermissionGroup = {
	_id: tsValidateStringAndNumbersWithDashes,
	label: validateGroupLabel,
	tags: undefined,
	accessLevelIds: tsValidateArray(tsValidateUniqueId, false),
	customFields: tsValidateArray(tsValidateObjectValues<string>(validateCustomFieldValues), false),
	__accessLevels: undefined,
	_audit: undefined
};

export const DBDef_PermissionGroup: DBDef<DB_PermissionGroup> = {
	validator: Validator_PermissionGroup,
	dbName: 'permissions--group',
	entityName: 'group',
	relativeUrl: '/v1/permissions/assign/groups',
};