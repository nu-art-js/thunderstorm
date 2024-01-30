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

import {MemKey_AccountId, ModuleBE_SessionDB, OnNewUserRegistered, OnUserLogin} from '@nu-art/user-account/backend';
import {
	_keys,
	ApiException,
	asOptionalArray,
	batchActionParallel,
	DB_BaseObject,
	dbObjectToId,
	filterDuplicates,
	filterInstances,
	flatArray,
	TypedMap
} from '@nu-art/ts-common';
import {DB_EntityDependency} from '@nu-art/firebase';
import {ApiDef_PermissionUser, DB_PermissionUser, DBDef_PermissionUser, Request_AssignPermissions} from '../../shared';
import {ModuleBE_PermissionGroup} from './ModuleBE_PermissionGroup';
import {UI_Account} from '@nu-art/user-account';
import {CanDeletePermissionEntities} from '../../core/can-delete';
import {PermissionTypes} from '../../../shared/types';
import {firestore} from 'firebase-admin';
import {MemKey_UserPermissions} from '../ModuleBE_PermissionsAssert';
import {addRoutes, createBodyServerApi, ModuleBE_BaseDBV2} from '@nu-art/thunderstorm/backend';
import {PostWriteProcessingData} from '@nu-art/firebase/backend/firestore-v2/FirestoreCollectionV2';
import Transaction = firestore.Transaction;


class ModuleBE_PermissionUserDB_Class
	extends ModuleBE_BaseDBV2<DB_PermissionUser>
	implements OnNewUserRegistered, OnUserLogin, CanDeletePermissionEntities<'Group', 'User'> {

	constructor() {
		super(DBDef_PermissionUser);
	}

	init() {
		super.init();
		addRoutes([createBodyServerApi(ApiDef_PermissionUser.vv1.assignPermissions, this.assignPermissions)]);
	}

	__canDeleteEntities = async <T extends 'Group'>(type: T, items: PermissionTypes[T][]): Promise<DB_EntityDependency<'User'>> => {
		let conflicts: DB_PermissionUser[] = [];
		const dependencies: Promise<DB_PermissionUser[]>[] = [];

		dependencies.push(batchActionParallel(items.map(dbObjectToId), 10, async ids => this.query.custom({where: {__groupIds: {$aca: ids}}})));
		if (dependencies.length)
			conflicts = flatArray(await Promise.all(dependencies));

		return {collectionKey: 'User', conflictingIds: filterDuplicates(conflicts.map(dbObjectToId))};
	};

	// protected async canDeleteDocument(transaction: FirestoreTransaction, dbInstances: DB_PermissionUser[]) {
	// 	const conflicts: DB_PermissionUser[] = [];
	// 	const accounts = await ModuleBE_AccountDB.query.custom(_EmptyQuery);
	//
	// 	for (const item of dbInstances) {
	// 		const account = accounts.find(acc => acc._id === item.accountId);
	// 		if (account)
	// 			conflicts.push(item);
	// 	}
	//
	// 	if (conflicts.length)
	// 		throw new ApiException<DB_EntityDependency<any>[]>(422, 'permission users are connected to accounts').setErrorBody({
	// 			type: 'has-dependencies',
	// 			body: conflicts.map(conflict => ({collectionKey: 'User', conflictingIds: [conflict._id]}))
	// 		});
	// }

	protected async preWriteProcessing(instance: DB_PermissionUser, t?: Transaction): Promise<void> {
		instance._auditorId = MemKey_AccountId.get();
		instance.__groupIds = filterDuplicates(instance.groups.map(group => group.groupId) || []);

		if (!instance.__groupIds.length)
			return;

		// Get all groups the user has from the collection
		const dbGroups = filterInstances(await ModuleBE_PermissionGroup.query.all(instance.__groupIds, t));
		// Verify all groups actually existing in the collection
		if (instance.__groupIds.length !== dbGroups.length) {
			const dbGroupIds = dbGroups.map(dbObjectToId);
			throw new ApiException(422, `Trying to assign a user to a permission-group that does not exist: ${instance.__groupIds.filter(groupId => !dbGroupIds.includes(groupId))}`);
		}

		//todo check for duplications in data
	}

	protected async postWriteProcessing(data: PostWriteProcessingData<DB_PermissionUser>) {
		const deleted = asOptionalArray(data.deleted) ?? [];
		const updated = asOptionalArray(data.updated) ?? [];
		const beforeIds = (asOptionalArray(data.before) ?? []).map(before => before?._id);

		const accountIdToInvalidate = filterDuplicates(filterInstances([...deleted, ...updated].map(i => i?._id))).filter(id => beforeIds.includes(id));
		await ModuleBE_SessionDB.session.invalidate(accountIdToInvalidate);
	}

	async __onUserLogin(account: UI_Account, transaction: Transaction) {
		await this.insertIfNotExist(account as UI_Account & DB_BaseObject, transaction);
	}

	async __onNewUserRegistered(account: UI_Account, transaction: Transaction) {
		await this.insertIfNotExist(account as UI_Account & DB_BaseObject, transaction);
	}

	async insertIfNotExist(uiAccount: UI_Account & DB_BaseObject, transaction: Transaction) {
		const permissionsUserToCreate = {_id: uiAccount._id, groups: [], _auditorId: MemKey_AccountId.get()};

		const create = async (transaction?: Transaction) => {
			return this.create.item(permissionsUserToCreate, transaction);
		};

		return this.collection.uniqueGetOrCreate({_id: uiAccount._id}, create, transaction);
	}

	async assignPermissions(body: Request_AssignPermissions) {
		if (!body.targetAccountIds.length)
			throw new ApiException(400, `Asked to modify permissions but provided no users to modify permissions of.`);

		const usersToGiveTo = filterInstances(await this.query.all(body.targetAccountIds));
		// console.log('assignPermissions target accounts ');
		// console.log(await this.query.custom(_EmptyQuery));
		if (!usersToGiveTo.length || usersToGiveTo.length !== body.targetAccountIds.length) {
			const dbUserIds = usersToGiveTo.map(dbObjectToId);
			throw new ApiException(404, `Asked to give permissions to non-existent user accounts: ${body.targetAccountIds.filter(id => !dbUserIds.includes(id))}`);
		}

		const dbGroups = filterInstances(await ModuleBE_PermissionGroup.query.all(body.permissionGroupIds));
		if (dbGroups.length !== body.permissionGroupIds.length) {
			const dbGroupIds = dbGroups.map(dbObjectToId);
			throw new ApiException(404, `Asked to give users non-existing permission groups: ${body.permissionGroupIds.filter(id => !dbGroupIds.includes(id))}`);
		}

		const myUserPermissions = MemKey_UserPermissions.get();

		const permissionsToGive = dbGroups.reduce<TypedMap<number>>((map, group) => {
			// Gather the highest permissions for each domain, from all groups
			(_keys(group._levelsMap || []) as string[]).forEach(domainId => {
				if (map[domainId] === undefined)
					map[domainId] = 0;

				if (map[domainId] < group._levelsMap![domainId])
					map[domainId] = group._levelsMap![domainId];

			});
			return map;
		}, {});

		const failedDomains = (_keys(permissionsToGive) as string[]).filter(domainId => {
			const tooLowPermission = myUserPermissions[domainId] < permissionsToGive[domainId];
			this.logError(`${myUserPermissions[domainId]} < ${permissionsToGive[domainId]} === ${tooLowPermission}`);
			const noPermissionInThisDomain = myUserPermissions[domainId] === undefined;
			return noPermissionInThisDomain || tooLowPermission;
		});

		if (failedDomains.length)
			throw new ApiException(403, `Attempted to give higher permissions than current user has: ${failedDomains}`);

		const groupIds = dbGroups.map(group => ({groupId: group._id}));
		const usersToUpdate = usersToGiveTo.map(user => {
			user.groups = groupIds;
			return user;
		});

		await this.set.multi(usersToUpdate);
	}
}

export const ModuleBE_PermissionUserDB = new ModuleBE_PermissionUserDB_Class();