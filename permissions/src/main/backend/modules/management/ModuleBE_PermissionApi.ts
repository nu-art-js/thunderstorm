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
import {_keys, ApiException, dbObjectToId, filterInstances, PreDB, TypedMap} from '@nu-art/ts-common';
import {MemKey_AccountId} from '@nu-art/user-account/backend';
import {DB_PermissionApi, DBDef_PermissionApi} from '../../shared';
import {ModuleBE_PermissionProject} from './ModuleBE_PermissionProject';
import {ModuleBE_PermissionAccessLevel} from './ModuleBE_PermissionAccessLevel';

import {firestore} from 'firebase-admin';
import Transaction = firestore.Transaction;


export class ModuleBE_PermissionApi_Class
	extends ModuleBE_BaseDBV2<DB_PermissionApi> {

	constructor() {
		super(DBDef_PermissionApi);
	}

	protected async preWriteProcessing(instance: DB_PermissionApi, t?: Transaction) {
		await ModuleBE_PermissionProject.query.uniqueAssert(instance.projectId);

		instance._auditorId = MemKey_AccountId.get();
		if (!instance.accessLevelIds?.length)
			return;

		// Check if any Domains appear more than once in this group
		const duplicationMap = instance.accessLevelIds.reduce<TypedMap<number>>((map, accessLevelId) => {

			if (map[accessLevelId] === undefined)
				map[accessLevelId] = 0;
			else
				map[accessLevelId]++;

			return map;
		}, {});

		const duplicateAccessLevelIds: string[] = filterInstances(_keys(duplicationMap).map(accessLevelId => duplicationMap[accessLevelId] > 1 ? accessLevelId : undefined) as string[]);
		if (duplicateAccessLevelIds.length)
			throw new ApiException(400, `Trying to create API with duplicate access levels: ${duplicateAccessLevelIds}`);

		// Verify all AccessLevels actually exist
		const dbAccessLevels = filterInstances(await ModuleBE_PermissionAccessLevel.query.all(instance.accessLevelIds));
		if (dbAccessLevels.length !== instance.accessLevelIds.length) {
			const dbAccessLevelIds = dbAccessLevels.map(dbObjectToId);
			throw new ApiException(404, `Asked to assign an api non existing accessLevels: ${instance.accessLevelIds.filter(id => !dbAccessLevelIds.includes(id))}`);
		}

		dbAccessLevels.forEach(accessLevel => {
			if (!instance._accessLevels)
				instance._accessLevels = {};
			instance._accessLevels[accessLevel.domainId] = accessLevel.value;
		});
	}

	registerApis(projectId: string, routes: string[]) {
		return this.runTransaction(async (transaction: Transaction) => {
			const existingProjectApis = await this.query.custom({where: {projectId: projectId}}, transaction);
			const apisToAdd: PreDB<DB_PermissionApi>[] = routes
				.filter(path => !existingProjectApis.find(api => api.path === path))
				.map(path => ({path, projectId: projectId, _auditorId: MemKey_AccountId.get()}));

			return this.set.all(apisToAdd, transaction);
		});
	}

	apiUpsert(): ServerApi<any> | undefined {
		return;
	}
}

export const ModuleBE_PermissionApi = new ModuleBE_PermissionApi_Class();
