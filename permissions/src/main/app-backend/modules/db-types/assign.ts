/*
 * ts-common is the basic building blocks of our typescript projects
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
	CollectionName_Groups,
	CollectionName_Users,
	DB_PermissionAccessLevel,
	DB_PermissionsGroup,
	DB_PermissionsUser
} from "../_imports";
import {
	BaseDB_ApiGenerator,
	validateOptionalId,
	validateUniqueId
} from "@nu-art/db-api-generator/backend";
import {
	OnNewUserRegistered,
	OnUserLogin
} from "@nu-art/user-account/backend";
import {Clause_Where} from "@nu-art/firebase";
import {ApiException} from "@nu-art/thunderstorm/backend";

import {
	filterDuplicates,
	TypeValidator,
	validateArray,
	validateObjectValues,
	validateRegexp
} from "@nu-art/ts-common";
import {AccessLevelPermissionsDB} from "./managment";
import {FirestoreTransaction} from "@nu-art/firebase/backend";

const validateUserUuid = validateRegexp(/^.{0,50}$/);
const validateGroupLabel = validateRegexp(/^[a-z-\._ ]+$/);
const validateCustomFieldValues = validateRegexp(/^.{0,500}$/);

function checkDuplicateLevelsDomain(levels: DB_PermissionAccessLevel[]) {
	const domainIds = levels.map(level => level.domainId);
	const filteredDomainIds = filterDuplicates(domainIds);
	if (filteredDomainIds.length !== domainIds.length)
		throw new ApiException(422, 'You trying insert duplicate accessLevel with the same domain');
}

export class GroupsDB_Class
	extends BaseDB_ApiGenerator<DB_PermissionsGroup> {
	static _validator: TypeValidator<DB_PermissionsGroup> = {
		_id: validateOptionalId,
		label: validateGroupLabel,
		accessLevelIds: validateArray(validateUniqueId, false),
		customFields: validateArray(validateObjectValues<string>(validateCustomFieldValues), false),
		__accessLevels: undefined
	};

	constructor() {
		super(CollectionName_Groups, GroupsDB_Class._validator, "group");
		this.setLockKeys(['__accessLevels']);
	}

	protected externalFilter(item: DB_PermissionsGroup): Clause_Where<DB_PermissionsGroup> {
		const {label} = item;
		return {label};
	}

	protected internalFilter(item: DB_PermissionsGroup): Clause_Where<DB_PermissionsGroup>[] {
		const {label} = item;
		return [{label}];
	}

	protected async upsertImpl(transaction: FirestoreTransaction, dbInstance: DB_PermissionsGroup): Promise<DB_PermissionsGroup> {
		dbInstance.__accessLevels = [];
		const accessLevelIds = dbInstance.accessLevelIds || [];
		if (accessLevelIds.length) {
			const groupLevels = await AccessLevelPermissionsDB.query({where: {_id: {$in: accessLevelIds}}});
			checkDuplicateLevelsDomain(groupLevels);
			dbInstance.__accessLevels = groupLevels.map(level => {
				return {domainId: level.domainId, value: level.value};
			});
		}

		return super.upsertImpl(transaction, dbInstance);
	}

	protected async assertCustomUniqueness(transaction: FirestoreTransaction, dbInstance: DB_PermissionsGroup) {
		if (!dbInstance.accessLevelIds)
			return;

		const filterAccessLevelIds = filterDuplicates(dbInstance.accessLevelIds);
		if (filterAccessLevelIds.length !== dbInstance.accessLevelIds?.length)
			throw new ApiException(422, 'You trying insert duplicate accessLevel id in group');
	}

	getConfig() {
		return this.config;
	}
}


export class UsersDB_Class
	extends BaseDB_ApiGenerator<DB_PermissionsUser>
	implements OnNewUserRegistered, OnUserLogin {
	static _validator: TypeValidator<DB_PermissionsUser> = {
		_id: validateOptionalId,
		uuid: validateUserUuid,
		groupIds: validateArray(validateUniqueId, false),
		accessLevelIds: validateArray(validateUniqueId, false),
		customFields: validateArray(validateObjectValues<string>(validateCustomFieldValues), false),
		__accessLevels: undefined
	};

	constructor() {
		super(CollectionName_Users, UsersDB_Class._validator, "user");
		this.setLockKeys(['__accessLevels', "uuid"]);
	}

	protected internalFilter(item: DB_PermissionsUser): Clause_Where<DB_PermissionsUser>[] {
		const {uuid} = item;
		return [{uuid}];
	}

	protected async upsertImpl(transaction: FirestoreTransaction, dbInstance: DB_PermissionsUser): Promise<DB_PermissionsUser> {
		dbInstance.__accessLevels = [];
		const accessLevelIds = dbInstance.accessLevelIds || [];
		if (accessLevelIds.length) {
			const userLevels = await AccessLevelPermissionsDB.query({where: {_id: {$in: accessLevelIds}}});
			checkDuplicateLevelsDomain(userLevels);
			dbInstance.__accessLevels = userLevels.map(level => {
				return {domainId: level.domainId, value: level.value};
			});
		}

		return super.upsertImpl(transaction, dbInstance);
	}

	async __onUserLogin(email: string) {
		await this.insertIfNotExist(email);
	}

	async __onNewUserRegistered(email: string) {
		await this.insertIfNotExist(email);
	}

	async insertIfNotExist(email: string) {
		const users = await this.query({where: {uuid: email}});
		if (users.length)
			return;

		return this.upsert({uuid: email, groupIds: [], accessLevelIds: []});
	}
}


export const GroupPermissionsDB = new GroupsDB_Class();
export const UserPermissionsDB = new UsersDB_Class();
