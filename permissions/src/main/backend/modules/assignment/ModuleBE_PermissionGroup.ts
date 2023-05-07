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
import {ApiException, ExpressRequest} from '@nu-art/thunderstorm/backend';
import {auditBy, batchAction, filterDuplicates, filterInstances, removeItemFromArray} from '@nu-art/ts-common';
import {ModuleBE_Account} from '@nu-art/user-account/backend';
import {DB_PermissionGroup, DBDef_PermissionGroup, PredefinedGroup} from '../../shared';
import {Clause_Where} from '@nu-art/firebase';
import {ModuleBE_PermissionUserDB} from './ModuleBE_PermissionUserDB';
import {BaseDB_ModuleBE} from '@nu-art/db-api-generator/backend';
import {checkDuplicateLevelsDomain, ModuleBE_PermissionAccessLevel} from '../management/ModuleBE_PermissionAccessLevel';


export class ModuleBE_PermissionGroup_Class
	extends BaseDB_ModuleBE<DB_PermissionGroup> {

	constructor() {
		super(DBDef_PermissionGroup);
	}

	protected externalFilter(item: DB_PermissionGroup): Clause_Where<DB_PermissionGroup> {
		const {label} = item;
		return {label};
	}

	protected internalFilter(item: DB_PermissionGroup): Clause_Where<DB_PermissionGroup>[] {
		const {label} = item;
		return [{label}];
	}

	protected async assertDeletion(transaction: FirestoreTransaction, dbInstance: DB_PermissionGroup): Promise<void> {
		const groups = await ModuleBE_PermissionUserDB.collection.query({where: {__groupIds: {$ac: dbInstance._id}}});

		if (groups.length) {
			throw new ApiException(403, 'You trying delete group that associated with users, you need delete this group from users first');
		}
	}

	private async setAccessLevels(dbInstance: DB_PermissionGroup) {
		dbInstance.__accessLevels = [];
		const accessLevelIds = dbInstance.accessLevelIds || [];
		if (accessLevelIds.length) {
			const groupLevels = await batchAction(accessLevelIds, 10, (chunked) => {
				return ModuleBE_PermissionAccessLevel.query({where: {_id: {$in: chunked}}});
			});
			checkDuplicateLevelsDomain(groupLevels);
			dbInstance.__accessLevels = groupLevels.map(level => {
				return {domainId: level.domainId, value: level.value};
			});
		}
	}

	async getGroupsByTags(tags: string[]) {
		const groupsByTags = await this.collection.query({where: {tags: {$aca: tags}}});
		if (!groupsByTags)
			return [];
		return groupsByTags;
	}

	async deleteTags(tag: string) {
		const groupsWithTags: DB_PermissionGroup[] | undefined = await this.collection.query({where: {tags: {$aca: [tag]}}});
		if (!groupsWithTags)
			return;
		for (const _group of groupsWithTags) {
			if (!_group.tags)
				continue;
			removeItemFromArray(_group.tags, tag);
			await this.collection.upsert(_group);
		}
	}

	protected async preUpsertProcessing(dbInstance: DB_PermissionGroup, t?: FirestoreTransaction, request?: ExpressRequest) {
		if (request) {
			const account = await ModuleBE_Account.validateSession({}, request);
			dbInstance._audit = auditBy(account.email);
		}

		if (!dbInstance.accessLevelIds)
			return;

		await this.setAccessLevels(dbInstance);
		const filterAccessLevelIds = filterDuplicates(dbInstance.accessLevelIds);
		if (filterAccessLevelIds.length !== dbInstance.accessLevelIds?.length)
			throw new ApiException(422, 'You trying test-add-data duplicate accessLevel id in group');
	}

	getConfig() {
		return this.config;
	}

	upsertPredefinedGroups(projectId: string, projectName: string, predefinedGroups: PredefinedGroup[]) {
		return this.runInTransaction(async (transaction) => {
			const _groups = predefinedGroups.map(group => ({
				_id: group._id,
				label: `${projectName}--${group.key}-${group.label}`
			}));

			const dbGroups = filterInstances(await batchAction(_groups.map(group => group._id), 10, (chunk) => {
				return transaction.query(this.collection, {where: {_id: {$in: chunk}}});
			}));

			//TODO patch the predefined groups, in case app changed the label of the group..
			const groupsToInsert = _groups.filter(group => !dbGroups.find(dbGroup => dbGroup._id === group._id));
			return this.upsertAll(groupsToInsert, transaction);
		});
	}

}

export const ModuleBE_PermissionGroup = new ModuleBE_PermissionGroup_Class();
