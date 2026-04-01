import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_PermissionRole, DB_PermissionRole, DBDef_PermissionRole} from '@nu-art/permissions-shared';
import {asArray, batchActionParallel, dbObjectToId, filterDuplicates} from '@nu-art/ts-common';
import {Transaction} from 'firebase-admin/firestore';
import {ModuleBE_PermissionUserDB} from '../permission-user/index.js';
import {CollectionActionType, PostWriteProcessingData} from '@nu-art/firebase-backend/firestore/FirestoreCollection';

export class ModuleBE_PermissionRoleDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_PermissionRole> {

	constructor() {
		super(DBDef_PermissionRole);
	}

	protected async preWriteProcessing(instance: DB_PermissionRole, originalDbInstance: DatabaseDef_PermissionRole['dbType'], t?: Transaction) {
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
