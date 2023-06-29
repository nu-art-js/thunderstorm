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
import {
	ApiException,
	auditBy,
	batchActionParallel,
	dbObjectToId,
	filterDuplicates,
	flatArray,
	MUSTNeverHappenException
} from '@nu-art/ts-common';
import {MemKey_AccountEmail} from '@nu-art/user-account/backend';
import {DB_PermissionAccessLevel, DBDef_PermissionAccessLevel, Request_CreateGroup} from '../../shared';
import {Clause_Where, DB_EntityDependency} from '@nu-art/firebase';
import {ModuleBE_PermissionDomain} from './ModuleBE_PermissionDomain';
import {ModuleBE_PermissionApi} from './ModuleBE_PermissionApi';
import {ModuleBE_PermissionGroup} from '../assignment/ModuleBE_PermissionGroup';
import {CanDeletePermissionEntities} from '../../core/can-delete';
import {PermissionTypes} from '../../../shared/types';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';


export class ModuleBE_PermissionAccessLevel_Class
	extends ModuleBE_BaseDB<DB_PermissionAccessLevel>
	implements CanDeletePermissionEntities<'Domain', 'Level'> {

	constructor() {
		// super(CollectionName_Level, LevelDB_Class._validator, 'level');
		super(DBDef_PermissionAccessLevel);
	}

	__canDeleteEntities = async <T extends 'Domain'>(type: T, items: PermissionTypes[T][], mem: MemStorage): Promise<DB_EntityDependency<'Level'>> => {
		let conflicts: DB_PermissionAccessLevel[] = [];
		const dependencies: Promise<DB_PermissionAccessLevel[]>[] = [];

		dependencies.push(batchActionParallel(items.map(dbObjectToId), 10, async ids => this.query({where: {domainId: {$in: ids}}}, mem)));
		if (dependencies.length)
			conflicts = flatArray(await Promise.all(dependencies));

		return {collectionKey: 'Level', conflictingIds: conflicts.map(dbObjectToId)};
	};

	protected internalFilter(item: DB_PermissionAccessLevel): Clause_Where<DB_PermissionAccessLevel>[] {
		const {domainId, name, value} = item;
		return [{domainId, name}, {domainId, value}];
	}

	protected async preUpsertProcessing(dbInstance: DB_PermissionAccessLevel, mem: MemStorage, t?: FirestoreTransaction) {
		await ModuleBE_PermissionDomain.queryUnique({_id: dbInstance.domainId}, mem);

		const email = MemKey_AccountEmail.get(mem);
		if (email)
			dbInstance._audit = auditBy(email);
	}

	protected async upsertImpl_Read(transaction: FirestoreTransaction, dbInstance: DB_PermissionAccessLevel, mem: MemStorage): Promise<() => Promise<DB_PermissionAccessLevel>> {
		const existDbLevel = await transaction.queryUnique(this.collection, {where: {_id: dbInstance._id}});
		const groups = await ModuleBE_PermissionGroup.query({where: {accessLevelIds: {$ac: dbInstance._id}}}, mem);
		const returnWrite = await super.upsertImpl_Read(transaction, dbInstance, mem);
		if (existDbLevel) {
			const callbackfn = (group: Request_CreateGroup) => {
				const index = group.accessLevelIds?.indexOf(dbInstance._id);
				if (index === undefined)
					throw new MUSTNeverHappenException('Query said it does exists!!');

				const accessLevel = group.__accessLevels?.[index];
				if (accessLevel === undefined)
					throw new MUSTNeverHappenException('Query said it does exists!!');

				accessLevel.value = dbInstance.value;
			};

			const asyncs = [];
			asyncs.push(...groups.map(async group => {
				await ModuleBE_PermissionGroup.validateImpl(group);
				await ModuleBE_PermissionGroup.assertUniqueness(group, mem, transaction);
				callbackfn(group);
			}));

			const upsertGroups = await transaction.upsertAll_Read(ModuleBE_PermissionGroup.collection, groups);
			await Promise.all(asyncs);

			// --- writes part
			await upsertGroups();
		}

		return returnWrite;
	}

	protected async assertDeletion(transaction: FirestoreTransaction, dbInstance: DB_PermissionAccessLevel, mem: MemStorage) {
		const groups = await ModuleBE_PermissionGroup.query({where: {accessLevelIds: {$ac: dbInstance._id}}}, mem);
		const apis = await ModuleBE_PermissionApi.query({where: {accessLevelIds: {$ac: dbInstance._id}}}, mem);

		if (groups.length || apis.length)
			throw new ApiException(403, 'You trying delete access level that associated with users/groups/apis, you need delete the associations first');
	}

	setUpdatedLevel(dbLevel: DB_PermissionAccessLevel, units: Request_CreateGroup[]) {
		units.forEach(unit => {
			let hasGroupDomainLevel = false;
			const updatedLevels = unit.__accessLevels?.map(level => {
				if (level.domainId === dbLevel.domainId) {
					level.value = dbLevel.value;
					hasGroupDomainLevel = true;
				}
				return level;
			}) || [];

			if (!hasGroupDomainLevel) {
				updatedLevels.push({domainId: dbLevel.domainId, value: dbLevel.value});
			}

			unit.__accessLevels = updatedLevels;
		});
	}
}

export function checkDuplicateLevelsDomain(levels: DB_PermissionAccessLevel[]) {
	const domainIds = levels.map(level => level.domainId);
	const filteredDomainIds = filterDuplicates(domainIds);
	if (filteredDomainIds.length !== domainIds.length)
		throw new ApiException(422, 'You trying test-add-data duplicate accessLevel with the same domain');
}

export const ModuleBE_PermissionAccessLevel = new ModuleBE_PermissionAccessLevel_Class();
