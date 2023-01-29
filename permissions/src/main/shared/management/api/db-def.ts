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

import {DBDef, tsValidateUniqueId} from '@nu-art/db-api-generator';
import {
	OmitDBObject,
	tsValidateArray,
	tsValidateBoolean,
	tsValidateNonMandatoryObject,
	tsValidateNumber,
	tsValidateString,
	TypeValidator
} from '@nu-art/ts-common';
import {tsValidateStringWithDashesAndSlash, validateProjectId} from '../../validators';
import {DB_PermissionApi} from './types';


const Validator_PermissionApi: TypeValidator<OmitDBObject<DB_PermissionApi>> = {
	projectId: validateProjectId,
	path: tsValidateStringWithDashesAndSlash,
	accessLevelIds: tsValidateArray(tsValidateUniqueId, false),
	_audit: tsValidateNonMandatoryObject({
		comment: tsValidateString(-1, false),
		auditBy: tsValidateString(),
		auditAt: {timestamp: tsValidateNumber(), pretty: tsValidateString(), timezone: tsValidateString(-1, false)}
	}),
	deprecated: tsValidateBoolean(false),
	onlyForApplication: tsValidateBoolean(false)
};

export const DBDef_PermissionApi: DBDef<DB_PermissionApi> = {
	validator: Validator_PermissionApi,
	dbName: 'permissions--api',
	entityName: 'permissions--api',
	lockKeys: ['projectId', 'path']
};