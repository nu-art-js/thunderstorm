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

import {FirestoreTransaction} from '@nu-art/firebase/backend';
import {
	ApiException,
	batchAction,
	batchActionParallel,
	dbObjectToId,
	filterDuplicates,
	filterInstances,
	flatArray,
	reduceToMap
} from '@nu-art/ts-common';
import {DB_PermissionGroup, DBDef_PermissionGroup} from '../../shared';
import {DB_EntityDependency} from '@nu-art/firebase';
import {ModuleBE_PermissionUserDB} from './ModuleBE_PermissionUserDB';
import {checkDuplicateLevelsDomain, ModuleBE_PermissionAccessLevel} from '../management/ModuleBE_PermissionAccessLevel';
import {CanDeletePermissionEntities} from '../../core/can-delete';
import {PermissionTypes} from '../../../shared/types';
import {ModuleBE_BaseDBV2} from '@nu-art/db-api-generator/backend/ModuleBE_BaseDBV2';
import {firestore} from 'firebase-admin';
import {MemKey_AccountId} from '@nu-art/user-account/backend';
import Transaction = firestore.Transaction;


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

		//todo verify the number of found dbLevels matches the number of instance.accessLevelIds

		instance._levelsMap = reduceToMap(dbLevels, dbLevel => dbLevel.domainId, dbLevel => dbLevel.value);

		if (!instance.accessLevelIds)
			return;

		instance.__accessLevels = [];
		const accessLevelIds = instance.accessLevelIds || [];
		if (accessLevelIds.length) {
			const groupLevels = await batchAction(accessLevelIds, 10, (chunked) => {
				return ModuleBE_PermissionAccessLevel.query.custom({where: {_id: {$in: chunked}}});
			});
			checkDuplicateLevelsDomain(groupLevels);
			instance.__accessLevels = groupLevels.map(level => {
				return {domainId: level.domainId, value: level.value};
			});
		}

		const filterAccessLevelIds = filterDuplicates(instance.accessLevelIds);
		if (filterAccessLevelIds.length !== instance.accessLevelIds?.length)
			throw new ApiException(422, 'You trying test-add-data duplicate accessLevel id in group');
	}

	protected async assertDeletion(transaction: FirestoreTransaction, dbInstance: DB_PermissionGroup): Promise<void> {
		const groups = await ModuleBE_PermissionUserDB.collection.query.custom({where: {__groupIds: {$ac: dbInstance._id}}});

		if (groups.length) {
			throw new ApiException(403, 'You trying delete group that associated with users, you need delete this group from users first');
		}
	}

	getConfig() {
		return this.config;
	}
}

export const ModuleBE_PermissionGroup = new ModuleBE_PermissionGroup_Class();
