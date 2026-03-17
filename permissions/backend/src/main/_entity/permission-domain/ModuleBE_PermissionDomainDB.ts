import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_PermissionDomain, DB_PermissionDomain, DBDef_PermissionDomain} from '@nu-art/permissions-shared';
import {ApiException} from '@nu-art/ts-common';
import {Transaction} from 'firebase-admin/firestore';
import {MemKey_AccountId} from '@nu-art/user-account-backend';
import {ModuleBE_PermissionAccessLevelDB} from '../permission-access-level/index.js';
import {ModuleBE_PermissionProjectDB} from '../permission-project/index.js';

export class ModuleBE_PermissionDomainDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_PermissionDomain> {

	constructor() {
		super(DBDef_PermissionDomain);
	}

	protected async assertDeletion(transaction: Transaction, dbInstance: DB_PermissionDomain) {
		const accessLevels = await ModuleBE_PermissionAccessLevelDB.query.custom({where: {domainId: dbInstance._id}});
		if (accessLevels.length) {
			throw new ApiException(403, 'You trying delete domain that associated with accessLevels, you need delete the accessLevels first');
		}
	}

	protected async preWriteProcessing(dbInstance: DB_PermissionDomain, originalDbInstance: DatabaseDef_PermissionDomain['dbType'], t?: Transaction) {
		await ModuleBE_PermissionProjectDB.query.uniqueAssert(dbInstance.projectId, t);
		dbInstance._auditorId = MemKey_AccountId.get();
	}
}

export const ModuleBE_PermissionDomainDB = new ModuleBE_PermissionDomainDB_Class();
