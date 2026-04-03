import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_PermissionRole, DB_PermissionRole, DBDef_PermissionRole, PermissionScope_Permissions} from '@nu-art/permissions-shared';
import {ApiException, asArray, batchActionParallel, dbObjectToId, filterDuplicates} from '@nu-art/ts-common';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {Transaction} from 'firebase-admin/firestore';
import {ModuleBE_PermissionUserDB} from '../permission-user/index.js';
import {CollectionActionType, PostWriteProcessingData} from '@nu-art/firebase-backend/firestore/FirestoreCollection';
import {wireScopePermission} from '../../entity-permissions.js';
import {MemKey_ServiceAccountId} from '../../consts.js';
import {ServiceAccountId_Bootstrap} from '../../modules/ModuleBE_Permissions.js';

export class ModuleBE_PermissionRoleDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_PermissionRole> {

	constructor() {
		super(DBDef_PermissionRole);
	}

	init() {
		super.init();
		wireScopePermission(this, PermissionScope_Permissions, 'admin');
	}

	protected async preWriteProcessing(instance: DB_PermissionRole, originalDbInstance: DatabaseDef_PermissionRole['dbType'], t?: Transaction) {
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
		await ModuleBE_PermissionUserDB.rotateSession(users.map(dbObjectToId));
	}
}

export const ModuleBE_PermissionRoleDB = new ModuleBE_PermissionRoleDB_Class();
