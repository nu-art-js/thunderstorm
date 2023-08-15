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

import {
	DBDef,
	OmitDBObject,
	tsValidateNameWithDashesAndDotsAndNumbers,
	tsValidateString,
	TypeValidator
} from '@nu-art/ts-common';
import {validateProjectId} from '../../validators';
import {DB_PermissionDomain} from './types';


const Validator_PermissionDomain: TypeValidator<OmitDBObject<DB_PermissionDomain>> = {
	projectId: validateProjectId,
	namespace: tsValidateNameWithDashesAndDotsAndNumbers,
	_auditorId: tsValidateString()
};

export const DBDef_PermissionDomain: DBDef<DB_PermissionDomain> = {
	validator: Validator_PermissionDomain,
	dbName: 'permissions--domain',
	entityName: 'PermissionsDomain',
	lockKeys: ['projectId'],
	generatedProps: ['_auditorId'],
};