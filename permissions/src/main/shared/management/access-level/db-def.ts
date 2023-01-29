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

import {DBDef, tsValidateStringWithDashes, tsValidateUniqueId} from '@nu-art/db-api-generator';
import {
	OmitDBObject,
	tsValidateNonMandatoryObject,
	tsValidateNumber,
	tsValidateIsInRange,
	tsValidateString,
	ValidatorTypeResolver
} from '@nu-art/ts-common';
import {DB_PermissionAccessLevel} from './types';


const Validator_PermissionAccessLevel: ValidatorTypeResolver<OmitDBObject<DB_PermissionAccessLevel>> = {
	domainId: tsValidateUniqueId,
	name: tsValidateStringWithDashes,
	value: tsValidateIsInRange([[0, 1000]]),
	_audit: tsValidateNonMandatoryObject({
		comment: tsValidateString(-1, false),
		auditBy: tsValidateString(),
		auditAt: {timestamp: tsValidateNumber(), pretty: tsValidateString(), timezone: tsValidateString(-1, false)}
	})
};

export const DBDef_PermissionAccessLevel: DBDef<DB_PermissionAccessLevel> = {
	validator: Validator_PermissionAccessLevel,
	dbName: 'permissions--level',
	entityName: 'permissions--level',
	lockKeys: ['domainId']
};