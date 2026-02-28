import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {Clause_Where} from '@nu-art/firebase-shared';
import {ApiException, batchActionParallel, dbObjectToId, filterDuplicates} from '@nu-art/ts-common';
import {Transaction} from 'firebase-admin/firestore';
import {ModuleBE_PermissionAPIDB} from '../permission-api/index.js';
import {ModuleBE_PermissionDomainDB} from '../permission-domain/index.js';
import {ModuleBE_PermissionGroupDB} from '../permission-group/index.js';
import {CollectionActionType, PostWriteProcessingData} from '@nu-art/firebase-backend/firestore-v3/FirestoreCollectionV3';
import {
	DatabaseDef_PermissionAccessLevel,
	DB_PermissionAccessLevel,
	DB_PermissionAccessLevel_1_0_0,
	DBDef_PermissionAccessLevel
} from '@nu-art/permissions-shared';

export class ModuleBE_PermissionAccessLevelDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_PermissionAccessLevel> {

	constructor() {
		super(DBDef_PermissionAccessLevel);
		this.registerVersionUpgradeProcessor('1.0.0', this.upgrade_100_101);
	}

	protected internalFilter(item: DB_PermissionAccessLevel): Clause_Where<DB_PermissionAccessLevel>[] {
		const {domainId, name, value} = item;
		return [{domainId, name}, {domainId, value}];
	}

	protected async preWriteProcessing(dbInstance: DB_PermissionAccessLevel, originalDbInstance: DatabaseDef_PermissionAccessLevel['dbType'], transaction?: Transaction) {
		await ModuleBE_PermissionDomainDB.query.uniqueAssert(dbInstance.domainId);
	}

	protected async postWriteProcessing(data: PostWriteProcessingData<DatabaseDef_PermissionAccessLevel['dbType']>, actionType: CollectionActionType, transaction?: Transaction): Promise<void> {
		const deleted = data.deleted ? (Array.isArray(data.deleted) ? data.deleted : [data.deleted]) : [];
		const updated = data.updated ? (Array.isArray(data.updated) ? data.updated : [data.updated]) : [];

		//Collect all apis that hold an access level id in the levels that have changed
		const deletedIds = deleted.map(dbObjectToId);
		const levelIds = [...deletedIds, ...updated.map(dbObjectToId)] as DatabaseDef_PermissionAccessLevel['id'][];
		const _connectedApis = await batchActionParallel(levelIds, 10, async ids => await ModuleBE_PermissionAPIDB.query.custom({where: {accessLevelIds: {$aca: ids}}}));

		const connectedApis = filterDuplicates(_connectedApis, api => api._id);
		deletedIds.forEach(id => {
			//For each deleted level remove it from any api that held it
			connectedApis.forEach(api => {
				api.accessLevelIds = api.accessLevelIds?.filter(i => i !== id);
			});
		});

		//Send all apis to upsert so their _accessLevels update
		await ModuleBE_PermissionAPIDB.set.all(connectedApis);
		return super.postWriteProcessing(data, actionType, transaction);
	}

	protected async assertDeletion(transaction: Transaction, dbInstance: DB_PermissionAccessLevel) {
		const groups = await ModuleBE_PermissionGroupDB.query.custom({where: {accessLevelIds: {$ac: dbInstance._id}}});
		const apis = await ModuleBE_PermissionAPIDB.query.custom({where: {accessLevelIds: {$ac: dbInstance._id}}});

		if (groups.length || apis.length)
			throw new ApiException(403, 'You trying delete access level that associated with users/groups/apis, you need delete the associations first');
	}

	private upgrade_100_101 = async (items: DB_PermissionAccessLevel_1_0_0[]) => {
		items.forEach(accessLevel => (accessLevel as DB_PermissionAccessLevel).uiLabel = accessLevel.name);
	};
}

export const ModuleBE_PermissionAccessLevelDB = new ModuleBE_PermissionAccessLevelDB_Class();

export function checkDuplicateLevelsDomain(levels: DB_PermissionAccessLevel[]) {
	const domainIds = levels.map(level => level.domainId);
	const filteredDomainIds = filterDuplicates(domainIds);
	if (filteredDomainIds.length !== domainIds.length)
		throw new ApiException(422, 'You trying test-add-data duplicate accessLevel with the same domain');
}