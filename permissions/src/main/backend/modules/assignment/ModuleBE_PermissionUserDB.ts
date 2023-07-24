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
	_keys,
	ApiException,
	auditBy,
	BadImplementationException,
	batchAction,
	batchActionParallel,
	compare,
	dbObjectToId,
	filterDuplicates,
	flatArray
} from '@nu-art/ts-common';
import {
	MemKey_AccountEmail,
	MemKey_AccountId,
	ModuleBE_v2_AccountDB,
	OnNewUserRegistered,
	OnUserLogin
} from '@nu-art/user-account/backend';
import {Clause_Where, DB_EntityDependency} from '@nu-art/firebase';
import {PermissionsShare} from '../permissions-share';
import {
	AssignAppPermissions,
	DB_PermissionUser,
	DBDef_PermissionUser,
	Request_AssignAppPermissions
} from '../../shared';
import {ModuleBE_PermissionGroup} from './ModuleBE_PermissionGroup';
import {UI_Account} from '@nu-art/user-account';
import {CanDeletePermissionEntities} from '../../core/can-delete';
import {PermissionTypes} from '../../../shared/types';
import {ModuleBE_BaseDBV2} from '@nu-art/db-api-generator/backend/ModuleBE_BaseDBV2';
import {firestore} from 'firebase-admin';
import Transaction = firestore.Transaction;


export class ModuleBE_PermissionUserDB_Class
	extends ModuleBE_BaseDBV2<DB_PermissionUser>
	implements OnNewUserRegistered, OnUserLogin, CanDeletePermissionEntities<'Group', 'User'> {

	constructor() {
		super(DBDef_PermissionUser);
	}

	__canDeleteEntities = async <T extends 'Group'>(type: T, items: PermissionTypes[T][]): Promise<DB_EntityDependency<'User'>> => {
		let conflicts: DB_PermissionUser[] = [];
		const dependencies: Promise<DB_PermissionUser[]>[] = [];

		dependencies.push(batchActionParallel(items.map(dbObjectToId), 10, async ids => this.query.custom({where: {__groupIds: {$aca: ids}}})));
		if (dependencies.length)
			conflicts = flatArray(await Promise.all(dependencies));

		return {collectionKey: 'User', conflictingIds: conflicts.map(dbObjectToId)};
	};

	protected async canDeleteDocument(transaction: FirestoreTransaction, dbInstances: DB_PermissionUser[]) {
		const conflicts: DB_PermissionUser[] = [];
		const accounts = await ModuleBE_v2_AccountDB.listUsers();

		for (const item of dbInstances) {
			const account = accounts.find(acc => acc._id === item.accountId);
			if (account)
				conflicts.push(item);
		}

		if (conflicts.length)
			throw new ApiException<DB_EntityDependency<any>[]>(422, 'permission users are connected to accounts').setErrorBody({
				type: 'has-dependencies',
				body: conflicts.map(conflict => ({collectionKey: 'User', conflictingIds: [conflict._id]}))
			});
	}

	protected async preWriteProcessing(dbInstance: DB_PermissionUser, t?: Transaction): Promise<void> {
		const email = MemKey_AccountEmail.get();
		if (email)
			dbInstance._audit = auditBy(email);

		this.setGroupIds(dbInstance);
		const userGroupIds = filterDuplicates(dbInstance.groups?.map(group => group.groupId) || []);
		if (!userGroupIds.length)
			return;

		const userGroups = await batchAction(userGroupIds, 10, (chunked) => {
			return ModuleBE_PermissionGroup.query.custom({where: {_id: {$in: chunked}}});
		});

		if (userGroupIds.length !== userGroups.length) {
			throw new ApiException(422, 'You trying upsert user with group that not found in group permissions db');
		}

		const userGroupsItems = dbInstance.groups || [];
		userGroupsItems.forEach((userGroupItem) => {
			userGroupsItems.forEach(innerUserGroupItem => {
				if (userGroupsItems.indexOf(userGroupItem) === userGroupsItems.indexOf(innerUserGroupItem))
					return;

				if (compare(userGroupItem.groupId, innerUserGroupItem.groupId) && compare(userGroupItem.customField || {}, innerUserGroupItem.customField || {})) {
					throw new ApiException(422, 'You trying upsert user with duplicate UserGroup (with the same groupId && customField)');
				}
			});
		});
	}

	protected internalFilter(item: DB_PermissionUser): Clause_Where<DB_PermissionUser>[] {
		const {accountId} = item;
		return [{accountId}];
	}

	private setGroupIds(dbInstance: DB_PermissionUser) {
		dbInstance.__groupIds = [];
		const userGroups = dbInstance.groups || [];
		if (userGroups.length) {
			dbInstance.__groupIds = userGroups.map(userGroup => userGroup.groupId);
		}
	}

	async __onUserLogin(account: UI_Account) {
		await this.insertIfNotExist(account.email);
	}

	async __onNewUserRegistered(account: UI_Account) {
		await this.insertIfNotExist(account.email);
	}

	async insertIfNotExist(email: string) {
		return this.runTransaction(async (transaction) => {

			const account = await ModuleBE_v2_AccountDB.getUser(email);
			if (!account)
				throw new ApiException(404, `user not found for email ${email}`);

			const users = await this.query.custom({where: {accountId: account._id}}, transaction);
			if (users.length)
				return;

			return this.set.item({accountId: account._id, groups: []}, transaction);
		});
	}

	async assignAppPermissions(body: Request_AssignAppPermissions) {

		let assignAppPermissionsObj: AssignAppPermissions;
		const accountId = MemKey_AccountId.get();
		if (body.appAccountId)
			// when creating project
			assignAppPermissionsObj = {...body, granterUserId: body.appAccountId, sharedUserIds: [accountId]};
		else
			// when I share with you
			assignAppPermissionsObj = {...body, granterUserId: accountId, sharedUserIds: body.sharedUserIds};
		const sharedUserIds = assignAppPermissionsObj.sharedUserIds || [];
		if (!sharedUserIds.length)
			throw new BadImplementationException('SharedUserIds is missing');

		const groupId = assignAppPermissionsObj.group._id;
		await PermissionsShare.verifyPermissionGrantingAllowed(assignAppPermissionsObj.granterUserId, {
			groupId,
			customField: assignAppPermissionsObj.customField
		});

		if (!assignAppPermissionsObj.groupsToRemove.find(groupToRemove => groupToRemove._id === assignAppPermissionsObj.group._id))
			throw new BadImplementationException('Group to must be a part of the groups to removed array');

		await this.runTransaction(async (transaction) => {
			const users = await batchAction(sharedUserIds, 10, (chunked) => {
				return this.query.custom({where: {accountId: {$in: chunked}}}, transaction);
			});

			if (users.length !== sharedUserIds.length)
				throw new ApiException(404, `No permissions USER for all user ids`); // TODO mention who miss?

			if (!assignAppPermissionsObj.customField || _keys(assignAppPermissionsObj.customField).length === 0)
				throw new ApiException(400, `Cannot set app permissions '${assignAppPermissionsObj.projectId}--${assignAppPermissionsObj.group._id}', request must have custom fields restriction!!`);

			const _group = await ModuleBE_PermissionGroup.query.uniqueAssert(groupId, transaction);
			if (!_group)
				throw new ApiException(404, `No permissions GROUP for id ${groupId}`);

			const updatedUsers = users.map(user => {
				const newGroups = (user.groups || [])?.filter(
					group => !assignAppPermissionsObj.groupsToRemove.find(groupToRemove => {
						if (groupToRemove._id !== group.groupId)
							return false;

						return compare(group.customField, assignAppPermissionsObj.customField, assignAppPermissionsObj.assertKeys);
					}));

				if (!newGroups.find(nGroup => nGroup.groupId === _group._id && compare(nGroup.customField, assignAppPermissionsObj.customField))) {
					newGroups.push({groupId: _group._id, customField: assignAppPermissionsObj.customField});
				}

				user.groups = newGroups;
				return user;
			});

			return this.set.all(updatedUsers, transaction);
		});
	}
}

export const ModuleBE_PermissionUserDB = new ModuleBE_PermissionUserDB_Class();
