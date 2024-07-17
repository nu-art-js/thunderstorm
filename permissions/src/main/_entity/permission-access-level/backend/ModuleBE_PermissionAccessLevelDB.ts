import {DBApiConfigV3, ModuleBE_BaseDB,} from '@nu-art/thunderstorm/backend';
import {DB_PermissionAccessLevel, DBDef_PermissionAccessLevel, DBProto_PermissionAccessLevel} from './shared';
import {Clause_Where} from '@nu-art/firebase';
import {ApiException, batchActionParallel, dbObjectToId, filterDuplicates} from '@nu-art/ts-common';
import {FirestoreTransaction} from '@nu-art/firebase/backend';
import {Transaction} from 'firebase-admin/firestore';
import {MemKey_AccountId} from '@nu-art/user-account/backend';
import {ModuleBE_PermissionAPIDB} from '../../permission-api/backend/ModuleBE_PermissionAPIDB';
import {ModuleBE_PermissionDomainDB} from '../../permission-domain/backend/ModuleBE_PermissionDomainDB';
import {ModuleBE_PermissionGroupDB} from '../../permission-group/backend/ModuleBE_PermissionGroupDB';
import {CollectionActionType, PostWriteProcessingData} from '@nu-art/firebase/backend/firestore-v3/FirestoreCollectionV3';


type Config = DBApiConfigV3<DBProto_PermissionAccessLevel> & {}

export class ModuleBE_PermissionAccessLevelDB_Class
	extends ModuleBE_BaseDB<DBProto_PermissionAccessLevel, Config> {

	constructor() {
		super(DBDef_PermissionAccessLevel);
	}

	protected internalFilter(item: DB_PermissionAccessLevel): Clause_Where<DB_PermissionAccessLevel>[] {
		const {domainId, name, value} = item;
		return [{domainId, name}, {domainId, value}];
	}

	protected async preWriteProcessing(dbInstance: DB_PermissionAccessLevel, originalDbInstance: DBProto_PermissionAccessLevel['dbType'], transaction?: Transaction) {
		await ModuleBE_PermissionDomainDB.query.uniqueAssert(dbInstance.domainId);

		dbInstance._auditorId = MemKey_AccountId.get();
	}

	protected async postWriteProcessing(data: PostWriteProcessingData<DBProto_PermissionAccessLevel>, actionType: CollectionActionType, transaction?: Transaction): Promise<void> {
		const deleted = data.deleted ? (Array.isArray(data.deleted) ? data.deleted : [data.deleted]) : [];
		const updated = data.updated ? (Array.isArray(data.updated) ? data.updated : [data.updated]) : [];

		//Collect all apis that hold an access level id in the levels that have changed
		const deletedIds = deleted.map(dbObjectToId);
		const levelIds = [...deletedIds, ...updated.map(dbObjectToId)];
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

	protected async assertDeletion(transaction: FirestoreTransaction, dbInstance: DB_PermissionAccessLevel) {
		const groups = await ModuleBE_PermissionGroupDB.query.custom({where: {accessLevelIds: {$ac: dbInstance._id}}});
		const apis = await ModuleBE_PermissionAPIDB.query.custom({where: {accessLevelIds: {$ac: dbInstance._id}}});

		if (groups.length || apis.length)
			throw new ApiException(403, 'You trying delete access level that associated with users/groups/apis, you need delete the associations first');
	}
}

export const ModuleBE_PermissionAccessLevelDB = new ModuleBE_PermissionAccessLevelDB_Class();

export function checkDuplicateLevelsDomain(levels: DB_PermissionAccessLevel[]) {
	const domainIds = levels.map(level => level.domainId);
	const filteredDomainIds = filterDuplicates(domainIds);
	if (filteredDomainIds.length !== domainIds.length)
		throw new ApiException(422, 'You trying test-add-data duplicate accessLevel with the same domain');
}