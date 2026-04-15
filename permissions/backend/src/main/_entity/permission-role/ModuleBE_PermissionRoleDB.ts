import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_PermissionRole, DBDef_PermissionRole} from '@nu-art/permissions-shared';
import {ApiException, asArray, batchActionParallel, dbObjectToId, filterDuplicates} from '@nu-art/ts-common';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {ModuleBE_PermissionUserDB} from '../permission-user/ModuleBE_PermissionUserDB.js';
import {CollectionActionType, PostWriteProcessingData} from '@nu-art/firebase-backend/firestore/FirestoreCollection';
import {MemKey_ServiceAccountId} from '../../consts.js';
import {ModuleBE_Permissions, ServiceAccountId_Bootstrap} from '../../modules/ModuleBE_Permissions.js';

export class ModuleBE_PermissionRoleDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_PermissionRole> {

	constructor() {
		super(DBDef_PermissionRole);
	}

	protected async preWriteProcessing(instance: DatabaseDef_PermissionRole['dbType'], originalDbInstance: DatabaseDef_PermissionRole['dbType']) {
		if (instance.system || originalDbInstance?.system) {
			const store = MemStorage.getStore();
			const activeServiceAccount = store ? MemKey_ServiceAccountId.peak() : undefined;
			if (activeServiceAccount !== ServiceAccountId_Bootstrap)
				throw new ApiException(403, 'System roles can only be modified by the bootstrap process');
		}
	}

	protected async postWriteProcessing(data: PostWriteProcessingData<DatabaseDef_PermissionRole['dbType']>, actionType: CollectionActionType) {
		const deleted = asArray(data.deleted ?? []);
		const updated = asArray(data.updated ?? []);
		const roleIds = filterDuplicates([...deleted, ...updated].map(r => r._id));
		const users = await batchActionParallel(roleIds, 10, async ids => await ModuleBE_PermissionUserDB.query.custom({where: {__roleIds: {$aca: ids}}}));
		const accountIds = filterDuplicates(users.map(dbObjectToId));
		await ModuleBE_Permissions.recomputePermissionsForUsers(accountIds);
	}
}

export const ModuleBE_PermissionRoleDB = new ModuleBE_PermissionRoleDB_Class();
