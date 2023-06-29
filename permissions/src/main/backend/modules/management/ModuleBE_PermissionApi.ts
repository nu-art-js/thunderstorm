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
import {ServerApi} from '@nu-art/thunderstorm/backend';
import {auditBy, filterDuplicates, PreDB} from '@nu-art/ts-common';
import {MemKey_AccountEmail} from '@nu-art/user-account/backend';
import {DB_PermissionApi, DBDef_PermissionApi} from '../../shared';
import {Clause_Where} from '@nu-art/firebase';
import {ModuleBE_PermissionProject} from './ModuleBE_PermissionProject';
import {ModuleBE_PermissionAccessLevel} from './ModuleBE_PermissionAccessLevel';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';


export class ModuleBE_PermissionApi_Class
	extends ModuleBE_BaseDB<DB_PermissionApi> {

	constructor() {
		super(DBDef_PermissionApi);
	}

	protected externalFilter(item: DB_PermissionApi): Clause_Where<DB_PermissionApi> {
		const {projectId, path} = item;
		return {projectId, path};
	}

	protected internalFilter(item: DB_PermissionApi): Clause_Where<DB_PermissionApi>[] {
		const {projectId, path} = item;
		return [{projectId, path}];
	}

	protected async preUpsertProcessing(dbInstance: DB_PermissionApi, mem: MemStorage, t?: FirestoreTransaction) {
		const email = MemKey_AccountEmail.get(mem);
		if (email)
			dbInstance._audit = auditBy(email);

		await ModuleBE_PermissionProject.queryUnique({_id: dbInstance.projectId}, mem);

		// need to assert that all the permissions levels exists in the db
		const _permissionsIds = dbInstance.accessLevelIds;
		if (!_permissionsIds || _permissionsIds.length <= 0)
			return;

		const permissionsIds = filterDuplicates(_permissionsIds);
		await Promise.all(permissionsIds.map(id => ModuleBE_PermissionAccessLevel.queryUnique({_id: id}, mem)));
		dbInstance.accessLevelIds = permissionsIds;
	}

	registerApis(projectId: string, routes: string[], mem: MemStorage) {
		return this.runInTransaction(async (transaction: FirestoreTransaction) => {
			const existingProjectApis = await this.query({where: {projectId: projectId}}, mem);
			const apisToAdd: PreDB<DB_PermissionApi>[] = routes
				.filter(path => !existingProjectApis.find(api => api.path === path))
				.map(path => ({path, projectId: projectId}));

			return this.upsertAll(apisToAdd, mem, transaction);
		});
	}

	apiUpsert(): ServerApi<any> | undefined {
		return;
	}
}

export const ModuleBE_PermissionApi = new ModuleBE_PermissionApi_Class();
