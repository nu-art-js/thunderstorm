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
	BadImplementationException,
	batchAction,
	batchActionParallel,
	compare,
	dbObjectToId,
	filterDuplicates,
	filterInstances,
	flatArray
} from '@nu-art/ts-common';
import {MemKey_AccountId, ModuleBE_v2_AccountDB, OnNewUserRegistered, OnUserLogin} from '@nu-art/user-account/backend';
import {DB_EntityDependency} from '@nu-art/firebase';
import {
	AssignAppPermissions,
	DB_PermissionUser,
	DBDef_PermissionUser,
	Request_AssignAppPermissions,
	Request_GivePermissionsToAnotherUser
} from '../../shared';
import {ModuleBE_PermissionGroup} from './ModuleBE_PermissionGroup';
import {UI_Account} from '@nu-art/user-account';
import {CanDeletePermissionEntities} from '../../core/can-delete';
import {PermissionTypes} from '../../../shared/types';
import {ModuleBE_BaseDBV2} from '@nu-art/db-api-generator/backend/ModuleBE_BaseDBV2';
import {firestore} from 'firebase-admin';
import {MemKey_UserPermissions} from '../ModuleBE_PermissionsAssert';
import Transaction = firestore.Transaction;


class ModuleBE_PermissionUserDB_Class
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

	protected async preWriteProcessing(instance: DB_PermissionUser, t?: Transaction): Promise<void> {
		instance._auditorId = MemKey_AccountId.get();
		instance.__groupIds = filterDuplicates(instance.groups.map(group => group.groupId) || []);

		if (!instance.__groupIds.length)
			return;

		// Get all groups the user has from the collection
		const dbGroups = await batchAction(instance.__groupIds, 10, (chunked) => {
			return ModuleBE_PermissionGroup.query.custom({where: {_id: {$in: chunked}}}, t);
		});
		// Verify all groups actually existing in the collection
		if (instance.__groupIds.length !== dbGroups.length) {
			const dbGroupIds = dbGroups.map(dbObjectToId);
			throw new ApiException(422, `Trying to assign a user to a permission-group that does not exist: ${instance.__groupIds.filter(groupId => !dbGroupIds.includes(groupId))}`);
		}

		//todo check for duplications in data
	}

	async __onUserLogin(account: UI_Account) {
		await this.insertIfNotExist(account.email);
	}

	async __onNewUserRegistered(account: UI_Account) {
		await this.insertIfNotExist(account.email);
	}

	async insertIfNotExist(email: string) {
		return this.runTransaction(async (t) => {
			let account;
			// Verify an account exists, to give it a user permissions object
			try {
				account = await ModuleBE_v2_AccountDB.query.uniqueWhere({email}, t);
			} catch (e: any) {
				throw new ApiException(404, `user not found for email ${email}`, e);
			}
			// Check if a user permissions object already exists, and create if not
			try {
				await this.query.uniqueWhere({accountId: account._id}, t);
			} catch (e: any) {
				await this.set.item({accountId: account._id, groups: [], _auditorId: MemKey_AccountId.get()}, t);
			}
		});
	}

	async loggedUserGiveOtherUsersPermissions(body: Request_GivePermissionsToAnotherUser, t: Transaction) {
		if (!body.accountToGivePermissionIds.length)
			throw new ApiException(400, `Asked to modify permissions but provided no users to modify permissions of.`);

		if (!body.groupIds.length && !body.groupsToRemoveIds.length)
			throw new ApiException(400, `Asked to give permissions but provided no permission groups to add or subtract permissions from.`);

		const usersToGiveTo = filterInstances(await this.query.all(body.accountToGivePermissionIds));
		if (!usersToGiveTo.length) {
			const dbUserIds = usersToGiveTo.map(dbObjectToId);
			throw new ApiException(404, `Asked to give permissions to non-existent user accounts: ${body.accountToGivePermissionIds.filter(id => !dbUserIds.includes(id))}`);
		}

		const dbGroups = filterInstances(await ModuleBE_PermissionGroup.query.all(body.groupIds));
		if (!dbGroups.length) {
			const dbGroupIds = dbGroups.map(dbObjectToId);
			throw new ApiException(404, `Asked to give users non-existing groups: ${body.accountToGivePermissionIds.filter(id => !dbGroupIds.includes(id))}`);
		}

		const myUserPermissions = MemKey_UserPermissions.get();
		// const myAccountId = MemKey_AccountId.get();
		// const myPermissionsUser = await this.query.uniqueWhere({accountId: myAccountId});

		dbGroups.map(group => group.);
		//todo give permissions
		//todo check my permissions are high enough to give the permissions I want to give
	}

	/**
	 * todo keep?
	 */
	async _assignAppPermissions(body: Request_AssignAppPermissions) {

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
		await PermissionsShare.verifyPermissionGrantingAllowed(assignAppPermissionsObj.granterUserId, {groupId});

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
