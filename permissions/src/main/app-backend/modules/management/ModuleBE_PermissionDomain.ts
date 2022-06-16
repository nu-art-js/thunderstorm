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
import {ApiException, ExpressRequest} from '@nu-art/thunderstorm/backend';
import {auditBy} from '@nu-art/ts-common';
import {AccountModuleBE} from '@nu-art/user-account/backend';
import {DB_PermissionDomain, DBDef_PermissionDomain} from '../../shared';
import {ModuleBE_PermissionAccessLevel} from './ModuleBE_PermissionAccessLevel';
import {ModuleBE_PermissionProject} from './ModuleBE_PermissionProject';


export class ModuleBE_PermissionDomain_Class
	extends BaseDB_ApiGenerator<DB_PermissionDomain> {

	constructor() {
		super(DBDef_PermissionDomain);
		this.setLockKeys(['projectId']);
	}

	protected async assertDeletion(transaction: FirestoreTransaction, dbInstance: DB_PermissionDomain) {
		const accessLevels = await ModuleBE_PermissionAccessLevel.query({where: {domainId: dbInstance._id}});
		if (accessLevels.length) {
			throw new ApiException(403, 'You trying delete domain that associated with accessLevels, you need delete the accessLevels first');
		}
	}

	internalFilter(item: DB_PermissionDomain) {
		return [{namespace: item.namespace, projectId: item.projectId}];
	}

	protected async preUpsertProcessing(transaction: FirestoreTransaction, dbInstance: DB_PermissionDomain, request?: ExpressRequest) {
		await ModuleBE_PermissionProject.queryUnique({_id: dbInstance.projectId});

		if (request) {
			const account = await AccountModuleBE.validateSession(request);
			dbInstance._audit = auditBy(account.email);
		}
	}
}

export const ModuleBE_PermissionDomain = new ModuleBE_PermissionDomain_Class();
