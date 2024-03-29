import {DBApiConfigV3, ModuleBE_BaseDBV3,} from '@nu-art/thunderstorm/backend';
import {DB_PermissionAccessLevel, DBDef_PermissionAccessLevel, DBProto_PermissionAccessLevel} from './shared';
import {CanDeletePermissionEntities} from '../../../backend/core/can-delete';
import {PermissionTypes} from '../../../shared/types';
import {Clause_Where, DB_EntityDependency} from '@nu-art/firebase';
import {ApiException, batchActionParallel, dbObjectToId, filterDuplicates, flatArray} from '@nu-art/ts-common';
import {PostWriteProcessingData} from '@nu-art/firebase/backend/firestore-v2/FirestoreCollectionV2';
import {FirestoreTransaction} from '@nu-art/firebase/backend';
import {Transaction} from 'firebase-admin/firestore';
import {MemKey_AccountId} from '@nu-art/user-account/backend';
import {ModuleBE_PermissionAPIDB} from '../../permission-api/backend/ModuleBE_PermissionAPIDB';
import {ModuleBE_PermissionDomainDB} from '../../permission-domain/backend/ModuleBE_PermissionDomainDB';
import {ModuleBE_PermissionGroupDB} from '../../permission-group/backend/ModuleBE_PermissionGroupDB';


type Config = DBApiConfigV3<DBProto_PermissionAccessLevel> & {}

export class ModuleBE_PermissionAccessLevelDB_Class
	extends ModuleBE_BaseDBV3<DBProto_PermissionAccessLevel, Config>
	implements CanDeletePermissionEntities<'PermissionDomain', 'PermissionAccessLevel'> {

	__canDeleteEntities = async <T extends 'PermissionDomain'>(type: T, items: PermissionTypes[T][]): Promise<DB_EntityDependency<'PermissionAccessLevel'>> => {
		let conflicts: DB_PermissionAccessLevel[] = [];
		const dependencies: Promise<DB_PermissionAccessLevel[]>[] = [];

		dependencies.push(batchActionParallel(items.map(dbObjectToId), 10, async ids => this.query.custom({where: {domainId: {$in: ids}}})));
		if (dependencies.length)
			conflicts = flatArray(await Promise.all(dependencies));

		return {collectionKey: 'PermissionAccessLevel', conflictingIds: conflicts.map(dbObjectToId)};
	};

	constructor() {
		super(DBDef_PermissionAccessLevel);
	}

	protected internalFilter(item: DB_PermissionAccessLevel): Clause_Where<DB_PermissionAccessLevel>[] {
		const {domainId, name, value} = item;
		return [{domainId, name}, {domainId, value}];
	}

	protected async preWriteProcessing(dbInstance: DB_PermissionAccessLevel, transaction?: Transaction) {
		await ModuleBE_PermissionDomainDB.query.uniqueAssert(dbInstance.domainId);

		dbInstance._auditorId = MemKey_AccountId.get();
	}

	protected async postWriteProcessing(data: PostWriteProcessingData<DB_PermissionAccessLevel>, transaction?: Transaction): Promise<void> {
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
		return super.postWriteProcessing(data, transaction);
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