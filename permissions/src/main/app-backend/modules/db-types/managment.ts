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
	CollectionName_Api,
	CollectionName_Domain,
	CollectionName_Level,
	CollectionName_Projects,
	DB_PermissionAccessLevel,
	DB_PermissionApi,
	DB_PermissionDomain,
	DB_PermissionProject,
	Request_CreateGroup,
} from '../_imports';
import {
	auditBy,
	filterDuplicates,
	MUSTNeverHappenException,
	PreDB,
	tsValidateArray,
	tsValidateRange,
	tsValidateRegexp,
	TypeValidator
} from '@nu-art/ts-common';
import {FirestoreTransaction} from '@nu-art/firebase/backend';
import {GroupPermissionsDB} from './assign';
import {Clause_Where} from '@nu-art/firebase';
import {ApiException} from '@nu-art/thunderstorm/app-backend/exceptions';
import {ExpressRequest, ServerApi} from '@nu-art/thunderstorm/backend';
import {BaseDB_ApiGenerator} from '@nu-art/db-api-generator/app-backend/BaseDB_ApiGenerator';
import {AccountModuleBE} from '@nu-art/user-account/app-backend/modules/AccountModuleBE';
import {
	tsValidateNameWithDashesAndDots,
	tsValidateOptionalId,
	tsValidateStringWithDashes,
	tsValidateUniqueId
} from '@nu-art/db-api-generator/shared/validators';

const validateProjectId = tsValidateRegexp(/^[a-z-]{3,20}$/);
export const validateProjectName = tsValidateRegexp(/^[A-Za-z- ]{3,20}$/);
export const tsValidateStringWithDashesAndSlash = tsValidateRegexp(/^[0-9A-Za-z-/]+$/);

export class ProjectDB_Class
	extends BaseDB_ApiGenerator<DB_PermissionProject> {
	static _validator: TypeValidator<DB_PermissionProject> = {
		...BaseDB_ApiGenerator.__validator,
		_id: validateProjectId,
		name: validateProjectName,
		customKeys: undefined,
		_audit: undefined
	};

	constructor() {
		super(CollectionName_Projects, ProjectDB_Class._validator, 'project');
	}

	protected async preUpsertProcessing(transaction: FirestoreTransaction, dbInstance: DB_PermissionProject, request?: ExpressRequest): Promise<void> {
		if (request) {
			const account = await AccountModuleBE.validateSession(request);
			dbInstance._audit = auditBy(account.email);
		}
	}

	apiPatch(): ServerApi<any> | undefined {
		return;
	}

	apiUpsert(): ServerApi<any> | undefined {
		return;
	}

	apiDelete(): ServerApi<any> | undefined {
		return;
	}
}


export class DomainDB_Class
	extends BaseDB_ApiGenerator<DB_PermissionDomain> {
	static _validator: TypeValidator<DB_PermissionDomain> = {
		...BaseDB_ApiGenerator.__validator,
		_id: tsValidateOptionalId,
		projectId: validateProjectId,
		namespace: tsValidateNameWithDashesAndDots,
		_audit: undefined
	};

	constructor() {
		super(CollectionName_Domain, DomainDB_Class._validator, 'domain');
		this.setLockKeys(['projectId']);
	}

	protected async assertDeletion(transaction: FirestoreTransaction, dbInstance: DB_PermissionDomain) {
		const accessLevels = await AccessLevelPermissionsDB.query({where: {domainId: dbInstance._id}});
		if (accessLevels.length) {
			throw new ApiException(403, 'You trying delete domain that associated with accessLevels, you need delete the accessLevels first');
		}
	}

	internalFilter(item: DB_PermissionDomain) {
		return [{namespace: item.namespace, projectId: item.projectId}];
	}

	protected async preUpsertProcessing(transaction: FirestoreTransaction, dbInstance: DB_PermissionDomain, request?: ExpressRequest) {
		await ProjectPermissionsDB.queryUnique({_id: dbInstance.projectId});

		if (request) {
			const account = await AccountModuleBE.validateSession(request);
			dbInstance._audit = auditBy(account.email);
		}
	}
}


export class LevelDB_Class
	extends BaseDB_ApiGenerator<DB_PermissionAccessLevel> {
	static _validator: TypeValidator<DB_PermissionAccessLevel> = {
		...BaseDB_ApiGenerator.__validator,
		_id: tsValidateOptionalId,
		domainId: tsValidateUniqueId,
		name: tsValidateStringWithDashes,
		value: tsValidateRange([[0, 1000]]),
		_audit: undefined
	};

	constructor() {
		super(CollectionName_Level, LevelDB_Class._validator, 'level');
		this.setLockKeys(['domainId']);
	}

	protected internalFilter(item: DB_PermissionAccessLevel): Clause_Where<DB_PermissionAccessLevel>[] {
		const {domainId, name, value} = item;
		return [{domainId, name}, {domainId, value}];
	}

	protected async preUpsertProcessing(transaction: FirestoreTransaction, dbInstance: DB_PermissionAccessLevel, request?: ExpressRequest) {
		await DomainPermissionsDB.queryUnique({_id: dbInstance.domainId});

		if (request) {
			const account = await AccountModuleBE.validateSession(request);
			dbInstance._audit = auditBy(account.email);
		}
	}

	protected async upsertImpl_Read(transaction: FirestoreTransaction, dbInstance: DB_PermissionAccessLevel, request: ExpressRequest): Promise<() => Promise<DB_PermissionAccessLevel>> {
		const existDbLevel = await transaction.queryUnique(this.collection, {where: {_id: dbInstance._id}});
		const groups = await GroupPermissionsDB.query({where: {accessLevelIds: {$ac: dbInstance._id}}});
		const returnWrite = await super.upsertImpl_Read(transaction, dbInstance, request);
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
				await GroupPermissionsDB.validateImpl(group);
				await GroupPermissionsDB.assertUniqueness(transaction, group);
				callbackfn(group);
			}));

			const upsertGroups = await transaction.upsertAll_Read(GroupPermissionsDB.collection, groups);
			await Promise.all(asyncs);

			// --- writes part
			await upsertGroups();
		}

		return returnWrite;
	}

	protected async assertDeletion(transaction: FirestoreTransaction, dbInstance: DB_PermissionAccessLevel) {
		const groups = await GroupPermissionsDB.query({where: {accessLevelIds: {$ac: dbInstance._id}}});
		const apis = await ApiPermissionsDB.query({where: {accessLevelIds: {$ac: dbInstance._id}}});

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

export class ApiDB_Class
	extends BaseDB_ApiGenerator<DB_PermissionApi> {

	static _validator: TypeValidator<DB_PermissionApi> = {
		...BaseDB_ApiGenerator.__validator,

		_id: tsValidateOptionalId,
		projectId: validateProjectId,
		path: tsValidateStringWithDashesAndSlash,
		accessLevelIds: tsValidateArray(tsValidateUniqueId, false),
		_audit: undefined,
		deprecated: undefined,
		onlyForApplication: undefined
	};

	constructor() {
		super(CollectionName_Api, ApiDB_Class._validator, 'api');
		this.setLockKeys(['projectId', 'path']);
	}

	protected externalFilter(item: DB_PermissionApi): Clause_Where<DB_PermissionApi> {
		const {projectId, path} = item;
		return {projectId, path};
	}

	protected internalFilter(item: DB_PermissionApi): Clause_Where<DB_PermissionApi>[] {
		const {projectId, path} = item;
		return [{projectId, path}];
	}

	protected async preUpsertProcessing(transaction: FirestoreTransaction, dbInstance: DB_PermissionApi, request?: ExpressRequest) {
		if (request) {
			const account = await AccountModuleBE.validateSession(request);
			dbInstance._audit = auditBy(account.email);
		}

		await ProjectPermissionsDB.queryUnique({_id: dbInstance.projectId});

		// need to assert that all the permissions levels exists in the db
		const _permissionsIds = dbInstance.accessLevelIds;
		if (!_permissionsIds || _permissionsIds.length <= 0)
			return;

		const permissionsIds = filterDuplicates(_permissionsIds);
		await Promise.all(permissionsIds.map(id => AccessLevelPermissionsDB.queryUnique({_id: id})));
		dbInstance.accessLevelIds = permissionsIds;
	}

	registerApis(projectId: string, routes: string[]) {
		return this.runInTransaction(async (transaction: FirestoreTransaction) => {
			const existingProjectApis = await ApiPermissionsDB.query({where: {projectId: projectId}});
			const apisToAdd: PreDB<DB_PermissionApi>[] = routes
				.filter(path => !existingProjectApis.find(api => api.path === path))
				.map(path => ({path, projectId: projectId}));

			return this.upsertAll(apisToAdd, transaction);
		});
	}

	apiUpsert(): ServerApi<any> | undefined {
		return;
	}
}


export const ProjectPermissionsDB = new ProjectDB_Class();
export const DomainPermissionsDB = new DomainDB_Class();
export const AccessLevelPermissionsDB = new LevelDB_Class();
export const ApiPermissionsDB = new ApiDB_Class();
