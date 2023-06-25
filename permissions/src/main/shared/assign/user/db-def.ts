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

import {tsValidateStringAndNumbersWithDashes} from '@nu-art/db-api-generator';
import {
	DBDef,
	OmitDBObject,
	tsValidateArray,
	tsValidateDynamicObject,
	tsValidateNonMandatoryObject,
	tsValidateNumber,
	tsValidateString,
	ValidatorTypeResolver
} from '@nu-art/ts-common';
import {validateUserUuid} from '../../validators';
import {DB_PermissionUser} from './types';


const Validator_PermissionUser: ValidatorTypeResolver<OmitDBObject<DB_PermissionUser>> = {
	accountId: validateUserUuid,
	groups: tsValidateArray({
		groupId: tsValidateStringAndNumbersWithDashes,
		// customField: tsValidateObjectValues<string>(validateCustomFieldValues, false)
		customField: tsValidateDynamicObject(tsValidateString(), tsValidateString())
	}, false),
	__groupIds: tsValidateArray(tsValidateStringAndNumbersWithDashes, false),
	_audit: tsValidateNonMandatoryObject({
		comment: tsValidateString(-1, false),
		auditBy: tsValidateString(),
		auditAt: {timestamp: tsValidateNumber(), pretty: tsValidateString(), timezone: tsValidateString(-1, false)}
	})
};

export const DBDef_PermissionUser: DBDef<DB_PermissionUser> = {
	validator: Validator_PermissionUser,
	dbName: 'permissions--user',
	entityName: 'permissions--user',
	lockKeys: ['accountId']
};
