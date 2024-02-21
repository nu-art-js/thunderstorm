import {DBApiConfigV3, ModuleBE_BaseDBV3,} from '@nu-art/thunderstorm/backend';
import {DB_PermissionDomain, DBDef_PermissionDomain, DBProto_PermissionDomain} from '../shared';
import {ApiException} from '@nu-art/ts-common';
import {ModuleBE_PermissionAccessLevelDB} from '../../permission-access-level/backend';
import {ModuleBE_PermissionProjectDB} from '../../permission-project/backend';
import {Transaction} from 'firebase-admin/firestore';
import {MemKey_AccountId} from '@nu-art/user-account/backend';

type Config = DBApiConfigV3<DBProto_PermissionDomain> & {}

export class ModuleBE_PermissionDomainDB_Class
	extends ModuleBE_BaseDBV3<DBProto_PermissionDomain, Config> {

	constructor() {
		super(DBDef_PermissionDomain);
	}

	protected async assertDeletion(transaction: Transaction, dbInstance: DB_PermissionDomain) {
		const accessLevels = await ModuleBE_PermissionAccessLevelDB.query.custom({where: {domainId: dbInstance._id}});
		if (accessLevels.length) {
			throw new ApiException(403, 'You trying delete domain that associated with accessLevels, you need delete the accessLevels first');
		}
	}

	internalFilter(item: DB_PermissionDomain) {
		return [{namespace: item.namespace, projectId: item.projectId}];
	}

	protected async preWriteProcessing(dbInstance: DB_PermissionDomain, t?: Transaction) {
		await ModuleBE_PermissionProjectDB.query.uniqueAssert(dbInstance.projectId, t);
		dbInstance._auditorId = MemKey_AccountId.get();
	}
}

export const ModuleBE_PermissionDomainDB = new ModuleBE_PermissionDomainDB_Class();
