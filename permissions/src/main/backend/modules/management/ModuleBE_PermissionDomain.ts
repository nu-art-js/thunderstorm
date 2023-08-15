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

import {ApiException, batchActionParallel, dbObjectToId, flatArray} from '@nu-art/ts-common';
import {MemKey_AccountId} from '@nu-art/user-account/backend';
import {DB_PermissionDomain, DB_PermissionProject, DBDef_PermissionDomain} from '../../shared';
import {ModuleBE_PermissionAccessLevel} from './ModuleBE_PermissionAccessLevel';
import {ModuleBE_PermissionProject} from './ModuleBE_PermissionProject';
import {CanDeletePermissionEntities} from '../../core/can-delete';
import {DB_EntityDependency} from '@nu-art/firebase';
import {ModuleBE_BaseDBV2} from '@nu-art/db-api-generator/backend/ModuleBE_BaseDBV2';
import {firestore} from 'firebase-admin';
import {_EmptyQuery} from '@nu-art/db-api-generator';
import Transaction = firestore.Transaction;


export class ModuleBE_PermissionDomain_Class
	extends ModuleBE_BaseDBV2<DB_PermissionDomain>
	implements CanDeletePermissionEntities<'Project', 'Domain'> {

	constructor() {
		super(DBDef_PermissionDomain);
	}

	__canDeleteEntities = async (type: 'Project', items: DB_PermissionProject[]): Promise<DB_EntityDependency<'Domain'>> => {
		let conflicts: DB_PermissionDomain[] = [];
		const dependencies: Promise<DB_PermissionDomain[]>[] = [];

		dependencies.push(batchActionParallel(items.map(dbObjectToId), 10, async projectIds => this.query.custom({where: {projectId: {$in: projectIds}}})));
		if (dependencies.length)
			conflicts = flatArray(await Promise.all(dependencies));

		return {collectionKey: 'Domain', conflictingIds: conflicts.map(dbObjectToId)};
	};

	protected async assertDeletion(transaction: Transaction, dbInstance: DB_PermissionDomain) {
		const accessLevels = await ModuleBE_PermissionAccessLevel.query.custom({where: {domainId: dbInstance._id}});
		if (accessLevels.length) {
			throw new ApiException(403, 'You trying delete domain that associated with accessLevels, you need delete the accessLevels first');
		}
	}

	internalFilter(item: DB_PermissionDomain) {
		return [{namespace: item.namespace, projectId: item.projectId}];
	}

	protected async preWriteProcessing(dbInstance: DB_PermissionDomain, t?: Transaction) {
		await ModuleBE_PermissionProject.query.uniqueAssert(dbInstance.projectId, t);
		dbInstance._auditorId = MemKey_AccountId.get();
	}
}

export const ModuleBE_PermissionDomain = new ModuleBE_PermissionDomain_Class();
