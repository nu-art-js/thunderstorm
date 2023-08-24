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

import {ModuleBE_BaseDBV2, ServerApi} from '@nu-art/thunderstorm/backend';
import {MemKey_AccountId} from '@nu-art/user-account/backend';
import {DB_PermissionProject, DBDef_PermissionProjects} from '../../shared';
import {firestore} from 'firebase-admin';
import Transaction = firestore.Transaction;

export class ModuleBE_PermissionProject_Class
	extends ModuleBE_BaseDBV2<DB_PermissionProject, {}, 'name'> {

	constructor() {
		super(DBDef_PermissionProjects);
	}

	protected async preWriteProcessing(dbInstance: DB_PermissionProject, t?: Transaction): Promise<void> {
		dbInstance._auditorId = MemKey_AccountId.get();
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
