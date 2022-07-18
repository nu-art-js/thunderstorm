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

import {BaseDB_ApiGenerator} from '@nu-art/db-api-generator/backend';
import {FirestoreTransaction} from '@nu-art/firebase/backend';
import {ApiDefServer, ApiException, ApiModule, createBodyServerApi, ExpressRequest} from '@nu-art/thunderstorm/backend';
import {_keys, auditBy, BadImplementationException, batchAction, compare, filterDuplicates} from '@nu-art/ts-common';
import {ModuleBE_Account, OnNewUserRegistered, OnUserLogin} from '@nu-art/user-account/backend';
import {Clause_Where} from '@nu-art/firebase';
import {PermissionsShare} from '../permissions-share';
import {
	ApiDef_PermissionUser,
	ApiStruct_PermissionsUser,
	AssignAppPermissions,
	DB_PermissionUser,
	DBDef_PermissionUser,
	Request_AssignAppPermissions
} from '../../shared';
import {ModuleBE_PermissionGroup} from './ModuleBE_PermissionGroup';
import {UI_Account} from '@nu-art/user-account';


export class ModuleBE_PermissionUser_Class
	extends BaseDB_ApiGenerator<DB_PermissionUser>
	implements OnNewUserRegistered, OnUserLogin, ApiDefServer<ApiStruct_PermissionsUser>, ApiModule {

	readonly v1: ApiDefServer<ApiStruct_PermissionsUser>['v1'];

	constructor() {
		super(DBDef_PermissionUser);
		this.setLockKeys(['accountId']);
		this.v1 = {
			assignAppPermissions: createBodyServerApi(ApiDef_PermissionUser.v1.assignAppPermissions, this.assignAppPermissions),
		};
	}

	useRoutes() {
		return this.v1;
	}

	protected async preUpsertProcessing(transaction: FirestoreTransaction, dbInstance: DB_PermissionUser, request?: ExpressRequest): Promise<void> {
		if (request) {
			const account = await ModuleBE_Account.validateSession({}, request);
			dbInstance._audit = auditBy(account.email);
		}

		this.setGroupIds(dbInstance);
		const userGroupIds = filterDuplicates(dbInstance.groups?.map(group => group.groupId) || []);
		if (!userGroupIds.length)
			return;

		const userGroups = await batchAction(userGroupIds, 10, (chunked) => {
			return ModuleBE_PermissionGroup.query({where: {_id: {$in: chunked}}});
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
		return this.runInTransaction(async (transaction) => {

			const account = await ModuleBE_Account.getUser(email);
			if (!account)
				throw new ApiException(404, `user not found for email ${email}`);

			const users = await transaction.query(this.collection, {where: {accountId: account._id}});
			if (users.length)
				return;

			return this.upsert({accountId: account._id, groups: []}, transaction);
		});
	}

	async assignAppPermissions(body: Request_AssignAppPermissions, request?: ExpressRequest) {
		const account = await ModuleBE_Account.validateSession({}, request);

		let assignAppPermissionsObj: AssignAppPermissions;
		if (body.appAccountId)
			// when creating project
			assignAppPermissionsObj = {...body, granterUserId: body.appAccountId, sharedUserIds: [account._id]};
		else
			// when I share with you
			assignAppPermissionsObj = {...body, granterUserId: account._id, sharedUserIds: body.sharedUserIds};
		const sharedUserIds = assignAppPermissionsObj.sharedUserIds || [];
		if (!sharedUserIds.length)
			throw new BadImplementationException('SharedUserIds is missing');

		const groupId = ModuleBE_PermissionGroup.getPredefinedGroupId(assignAppPermissionsObj.projectId, assignAppPermissionsObj.group._id);
		await PermissionsShare.verifyPermissionGrantingAllowed(assignAppPermissionsObj.granterUserId,
			{groupId, customField: assignAppPermissionsObj.customField});

		if (!assignAppPermissionsObj.groupsToRemove.find(groupToRemove => groupToRemove._id === assignAppPermissionsObj.group._id))
			throw new BadImplementationException('Group to must be a part of the groups to removed array');

		await this.runInTransaction(async (transaction) => {
			const users = await batchAction(sharedUserIds, 10, (chunked) => {
				return transaction.query(this.collection, {where: {accountId: {$in: chunked}}});
			});

			if (users.length !== sharedUserIds.length)
				throw new ApiException(404, `No permissions USER for all user ids`); // TODO mention who miss?

			if (!assignAppPermissionsObj.customField || _keys(assignAppPermissionsObj.customField).length === 0)
				throw new ApiException(400, `Cannot set app permissions '${assignAppPermissionsObj.projectId}--${assignAppPermissionsObj.group._id}', request must have custom fields restriction!!`);

			const _group = await transaction.queryUnique(ModuleBE_PermissionGroup.collection, {where: {_id: groupId}});
			if (!_group)
				throw new ApiException(404, `No permissions GROUP for id ${groupId}`);

			const updatedUsers = users.map(user => {
				const newGroups = (user.groups || [])?.filter(
					group => !assignAppPermissionsObj.groupsToRemove.find(groupToRemove => {
						if (ModuleBE_PermissionGroup.getPredefinedGroupId(assignAppPermissionsObj.projectId, groupToRemove._id) !== group.groupId)
							return false;

						return compare(group.customField, assignAppPermissionsObj.customField, assignAppPermissionsObj.assertKeys);
					}));

				if (!newGroups.find(nGroup => nGroup.groupId === _group._id && compare(nGroup.customField, assignAppPermissionsObj.customField))) {
					newGroups.push({groupId: _group._id, customField: assignAppPermissionsObj.customField});
				}

				user.groups = newGroups;
				return user;
			});

			return this.upsertAll(updatedUsers, transaction, request);
		});
	}
}

export const ModuleBE_PermissionUser = new ModuleBE_PermissionUser_Class();
