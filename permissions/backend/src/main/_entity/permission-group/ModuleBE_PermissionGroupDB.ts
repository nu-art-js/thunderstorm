import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DB_PermissionGroup, DBDef_PermissionGroup, DatabaseDef_PermissionGroup} from '@nu-art/permissions-shared';
import {batchActionParallel, dbObjectToId, filterDuplicates} from '@nu-art/ts-common';
import {Transaction} from 'firebase-admin/firestore';
import {MemKey_AccountId} from '@nu-art/user-account-backend';
import {ModuleBE_PermissionUserDB} from '../permission-user/index.js';
import {CollectionActionType, PostWriteProcessingData} from '@nu-art/firebase-backend/firestore/FirestoreCollection';

export class ModuleBE_PermissionGroupDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_PermissionGroup> {

	constructor() {
		super(DBDef_PermissionGroup);
		this.registerVersionUpgradeProcessor('1.0.0', this.upgrade_100_200);
	}

	protected async preWriteProcessing(instance: DB_PermissionGroup, originalDbInstance: DatabaseDef_PermissionGroup['dbType'], t?: Transaction) {
		instance._auditorId = MemKey_AccountId.get();
	}

	protected async postWriteProcessing(data: PostWriteProcessingData<DatabaseDef_PermissionGroup['dbType']>, actionType: CollectionActionType) {
		const deleted = data.deleted ? (Array.isArray(data.deleted) ? data.deleted : [data.deleted]) : [];
		const updated = data.updated ? (Array.isArray(data.updated) ? data.updated : [data.updated]) : [];
		const groupIds = filterDuplicates([...deleted, ...updated].map(dbObjectToId)) as DatabaseDef_PermissionGroup['id'][];
		const users = await batchActionParallel(groupIds, 10, async ids => await ModuleBE_PermissionUserDB.query.custom({where: {__groupIds: {$aca: ids}}}));
		await ModuleBE_PermissionUserDB.rotateSession(users.map(dbObjectToId));
	}

	private upgrade_100_200 = async (items: DB_PermissionGroup[]) => {
		items.forEach(group => {
			group.uiLabel = group.label;
			group.scopeEntries = group.scopeEntries ?? [];
		});
	};
}

export const ModuleBE_PermissionGroupDB = new ModuleBE_PermissionGroupDB_Class();
