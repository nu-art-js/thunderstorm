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

import {BaseDB_ModuleBE} from '@nu-art/db-api-generator/backend';
import {FirestoreTransaction} from '@nu-art/firebase/backend';
import {ExpressRequest, ServerApi} from '@nu-art/thunderstorm/backend';
import {auditBy, filterDuplicates, PreDB} from '@nu-art/ts-common';
import {ModuleBE_Account} from '@nu-art/user-account/backend';
import {DB_PermissionApi, DBDef_PermissionApi} from '../../shared';
import {Clause_Where} from '@nu-art/firebase';
import {ModuleBE_PermissionProject} from './ModuleBE_PermissionProject';
import {ModuleBE_PermissionAccessLevel} from './ModuleBE_PermissionAccessLevel';


export class ModuleBE_PermissionApi_Class
	extends BaseDB_ModuleBE<DB_PermissionApi> {

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

	protected async preUpsertProcessing(transaction: FirestoreTransaction, dbInstance: DB_PermissionApi, request?: ExpressRequest) {
		if (request) {
			const account = await ModuleBE_Account.validateSession({}, request);
			dbInstance._audit = auditBy(account.email);
		}

		await ModuleBE_PermissionProject.queryUnique({_id: dbInstance.projectId});

		// need to assert that all the permissions levels exists in the db
		const _permissionsIds = dbInstance.accessLevelIds;
		if (!_permissionsIds || _permissionsIds.length <= 0)
			return;

		const permissionsIds = filterDuplicates(_permissionsIds);
		await Promise.all(permissionsIds.map(id => ModuleBE_PermissionAccessLevel.queryUnique({_id: id})));
		dbInstance.accessLevelIds = permissionsIds;
	}

	registerApis(projectId: string, routes: string[]) {
		return this.runInTransaction(async (transaction: FirestoreTransaction) => {
			const existingProjectApis = await this.query({where: {projectId: projectId}});
			const apisToAdd: PreDB<DB_PermissionApi>[] = routes
				.filter(path => !existingProjectApis.find(api => api.path === path))
				.map(path => ({path, projectId: projectId}));

			return this.upsertAll(apisToAdd, transaction);
		});
	}

	apiUpsert(): ServerApi<any> | undefined {
		return;
	}
}

export const ModuleBE_PermissionApi = new ModuleBE_PermissionApi_Class();
