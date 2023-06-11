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

import {ModuleBE_BaseDB} from '@nu-art/db-api-generator/backend';
import {FirestoreTransaction} from '@nu-art/firebase/backend';
import {ExpressRequest, ServerApi} from '@nu-art/thunderstorm/backend';
import {auditBy} from '@nu-art/ts-common';
import {MemKey_AccountEmail, ModuleBE_Account} from '@nu-art/user-account/backend';
import {DB_PermissionProject, DBDef_PermissionProjects} from '../../shared';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';


export class ModuleBE_PermissionProject_Class
	extends ModuleBE_BaseDB<DB_PermissionProject> {

	constructor() {
		super(DBDef_PermissionProjects);
	}

	protected async preUpsertProcessing(dbInstance: DB_PermissionProject, mem: MemStorage, t?: FirestoreTransaction): Promise<void> {
		dbInstance._audit = auditBy(MemKey_AccountEmail.get(mem));
	}

	apiPatch(): ServerApi<any> | undefined {
		return;
	}

	apiUpsert(): ServerApi<any> | undefined {
		return;
	}

	apiDelete(): ServerApi<any> | undefined {
		return;
	}
}

export const ModuleBE_PermissionProject = new ModuleBE_PermissionProject_Class();
