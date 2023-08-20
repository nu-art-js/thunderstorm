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
	_keys,
	ApiException,
	batchActionParallel,
	dbObjectToId, filterDuplicates,
	filterInstances,
	flatArray,
	reduceToMap,
	TypedMap
} from '@nu-art/ts-common';
import {DB_PermissionGroup, DBDef_PermissionGroup} from '../../shared';
import {DB_EntityDependency} from '@nu-art/firebase';
import {ModuleBE_PermissionAccessLevel} from '../management/ModuleBE_PermissionAccessLevel';
import {CanDeletePermissionEntities} from '../../core/can-delete';
import {PermissionTypes} from '../../../shared/types';
import {ModuleBE_BaseDBV2} from '@nu-art/db-api-generator/backend/ModuleBE_BaseDBV2';
import {firestore} from 'firebase-admin';
import Transaction = firestore.Transaction;
import {MemKey_AccountId} from '@nu-art/user-account/backend/core/consts';
import {PostWriteProcessingData} from '@nu-art/firebase/backend/firestore-v2/FirestoreCollectionV2';
import {ModuleBE_PermissionUserDB} from './ModuleBE_PermissionUserDB';
import {ModuleBE_v3_SessionDB} from '@nu-art/user-account/backend';


export class ModuleBE_PermissionGroup_Class
	extends ModuleBE_BaseDBV2<DB_PermissionGroup>
	implements CanDeletePermissionEntities<'Level', 'Group'> {

	constructor() {
		super(DBDef_PermissionGroup);
	}

	__canDeleteEntities = async <T extends 'Level'>(type: T, items: PermissionTypes[T][]): Promise<DB_EntityDependency<'Group'>> => {
		let conflicts: DB_PermissionGroup[] = [];
		const dependencies: Promise<DB_PermissionGroup[]>[] = [];

		dependencies.push(batchActionParallel(items.map(dbObjectToId), 10, async ids => this.query.custom({where: {accessLevelIds: {$aca: ids}}})));
		if (dependencies.length)
			conflicts = flatArray(await Promise.all(dependencies));

		return {collectionKey: 'Group', conflictingIds: conflicts.map(dbObjectToId)};
	};

	protected async preWriteProcessing(instance: DB_PermissionGroup, t?: Transaction) {
		instance._auditorId = MemKey_AccountId.get();
		const dbLevels = filterInstances(await ModuleBE_PermissionAccessLevel.query.all(instance.accessLevelIds, t));

		if (dbLevels.length < instance.accessLevelIds.length) {
			const dbAccessLevelIds = dbLevels.map(dbObjectToId);
			throw new ApiException(404, `Asked to assign a group non existing accessLevels: ${instance.accessLevelIds.filter(id => !dbAccessLevelIds.includes(id))}`);
		}

		// Find if there is more than one access level with the same domainId.
		const duplicationMap = dbLevels.reduce<TypedMap<number>>((map, level) => {

			if (map[level.domainId] === undefined)
				map[level.domainId] = 0;
			else
				map[level.domainId]++;

			return map;
		}, {});
		// Get all domainIds that appear more than once on this group
		const duplicateDomainIds: string[] = filterInstances(_keys(duplicationMap).map(domainId => duplicationMap[domainId] > 1 ? domainId : undefined) as string[]);

		if (duplicateDomainIds.length > 0)
			throw new ApiException(400, `Can't add a group with more than one access level per domain: ${duplicateDomainIds}`);

		instance._levelsMap = reduceToMap(dbLevels, dbLevel => dbLevel.domainId, dbLevel => dbLevel.value);
	}

	protected async postWriteProcessing(data: PostWriteProcessingData<DB_PermissionGroup>) {
		const deleted = data.deleted ? (Array.isArray(data.deleted) ? data.deleted : [data.deleted]) : [];
		const updated = data.updated ? (Array.isArray(data.updated) ? data.updated : [data.updated]) : [];
		const groupIds = filterDuplicates([...deleted, ...updated].map(dbObjectToId));
		const users = await batchActionParallel(groupIds, 10, async ids => await ModuleBE_PermissionUserDB.query.custom({where: {__groupIds: {$aca: ids}}}));
		await ModuleBE_v3_SessionDB.invalidateSessions(users.map(i => i.accountId));
	}
}

export const ModuleBE_PermissionGroup = new ModuleBE_PermissionGroup_Class();
