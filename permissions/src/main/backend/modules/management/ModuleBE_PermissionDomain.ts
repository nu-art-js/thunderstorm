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

import {DB_EntityDependency, ModuleBE_BaseDB} from '@nu-art/db-api-generator/backend';
import {FirestoreTransaction} from '@nu-art/firebase/backend';
import {ExpressRequest} from '@nu-art/thunderstorm/backend';
import {ApiException, auditBy, batchActionParallel, dbObjectToId, flatArray} from '@nu-art/ts-common';
import {ModuleBE_Account} from '@nu-art/user-account/backend';
import {DB_PermissionDomain, DB_PermissionProject, DBDef_PermissionDomain} from '../../shared';
import {ModuleBE_PermissionAccessLevel} from './ModuleBE_PermissionAccessLevel';
import {ModuleBE_PermissionProject} from './ModuleBE_PermissionProject';
import {CanDeletePermissionEntities} from '../../core/can-delete';


export class ModuleBE_PermissionDomain_Class
	extends ModuleBE_BaseDB<DB_PermissionDomain>
	implements CanDeletePermissionEntities<'Project', 'Domain'> {

	constructor() {
		super(DBDef_PermissionDomain);
	}

	__canDeleteEntities = async (type: 'Project', items: DB_PermissionProject[]): Promise<DB_EntityDependency<'Domain'>> => {
		let conflicts: DB_PermissionDomain[] = [];
		const dependencies: Promise<DB_PermissionDomain[]>[] = [];

		dependencies.push(batchActionParallel(items.map(dbObjectToId), 10, async projectIds => this.query({where: {projectId: {$in: projectIds}}})));
		if (dependencies.length)
			conflicts = flatArray(await Promise.all(dependencies));

		return {collectionKey: 'Domain', conflictingIds: conflicts.map(dbObjectToId)};
	};

	protected async assertDeletion(transaction: FirestoreTransaction, dbInstance: DB_PermissionDomain) {
		const accessLevels = await ModuleBE_PermissionAccessLevel.query({where: {domainId: dbInstance._id}});
		if (accessLevels.length) {
			throw new ApiException(403, 'You trying delete domain that associated with accessLevels, you need delete the accessLevels first');
		}
	}

	internalFilter(item: DB_PermissionDomain) {
		return [{namespace: item.namespace, projectId: item.projectId}];
	}

	protected async preUpsertProcessing(dbInstance: DB_PermissionDomain, t?: FirestoreTransaction, request?: ExpressRequest) {
		await ModuleBE_PermissionProject.queryUnique({_id: dbInstance.projectId});

		if (request) {
			const account = await ModuleBE_Account.validateSession({}, request);
			dbInstance._audit = auditBy(account.email);
		}
	}
}

export const ModuleBE_PermissionDomain = new ModuleBE_PermissionDomain_Class();
