import {DBApiConfigV3, ModuleBE_BaseDBV3,} from '@nu-art/thunderstorm/backend';
import {DB_PermissionGroup, DBDef_PermissionGroup, DBProto_PermissionGroup} from '../shared';
import {CanDeletePermissionEntities} from '../../../backend/core/can-delete';
import {PermissionTypes} from '../../../shared/types';
import {DB_EntityDependency} from '@nu-art/firebase';
import {_keys, ApiException, batchActionParallel, dbObjectToId, filterDuplicates, filterInstances, flatArray, reduceToMap, TypedMap} from '@nu-art/ts-common';
import {ModuleBE_PermissionAccessLevelDB} from '../../permission-access-level/backend';
import {PostWriteProcessingData} from '@nu-art/firebase/backend/firestore-v2/FirestoreCollectionV2';
import {Transaction} from 'firebase-admin/firestore';
import {MemKey_AccountId, ModuleBE_SessionDB} from '@nu-art/user-account/backend';
import {ModuleBE_PermissionUserDB} from '../../permission-user/backend';


type Config = DBApiConfigV3<DBProto_PermissionGroup> & {}

export class ModuleBE_PermissionGroupDB_Class
	extends ModuleBE_BaseDBV3<DBProto_PermissionGroup, Config>
	implements CanDeletePermissionEntities<'PermissionAccessLevel', 'PermissionGroup'> {

	constructor() {
		super(DBDef_PermissionGroup);
	}

	__canDeleteEntities = async <T extends 'PermissionAccessLevel'>(type: T, items: PermissionTypes[T][]): Promise<DB_EntityDependency<'PermissionGroup'>> => {
		let conflicts: DB_PermissionGroup[] = [];
		const dependencies: Promise<DB_PermissionGroup[]>[] = [];

		dependencies.push(batchActionParallel(items.map(dbObjectToId), 10, async ids => this.query.custom({where: {accessLevelIds: {$aca: ids}}})));
		if (dependencies.length)
			conflicts = flatArray(await Promise.all(dependencies));

		return {collectionKey: 'PermissionGroup', conflictingIds: filterDuplicates(conflicts.map(dbObjectToId))};
	};

	protected async preWriteProcessing(instance: DB_PermissionGroup, t?: Transaction) {
		instance._auditorId = MemKey_AccountId.get();
		const dbLevels = filterInstances(await ModuleBE_PermissionAccessLevelDB.query.all(instance.accessLevelIds, t));

		if (dbLevels.length < instance.accessLevelIds.length) {
			const dbAccessLevelIds = dbLevels.map(dbObjectToId);
			throw new ApiException(404, `Asked to assign a group non existing accessLevels: ${instance.accessLevelIds.filter(id => !dbAccessLevelIds.includes(id))}`);
		}

		// Find if there is more than one access level with the same domainId.
		const duplicationMap = dbLevels.reduce<TypedMap<number>>((map, level) => {

			if (map[level.domainId] === undefined)
				map[level.domainId] = 0;
			else
				map[level.domainId]++;

			return map;
		}, {});
		// Get all domainIds that appear more than once on this group
		const duplicateDomainIds: string[] = filterInstances(_keys(duplicationMap)
			.map(domainId => duplicationMap[domainId] > 1 ? domainId : undefined) as string[]);

		if (duplicateDomainIds.length > 0)
			throw new ApiException(400, `Can't add a group with more than one access level per domain: ${duplicateDomainIds}`);

		instance._levelsMap = reduceToMap(dbLevels, dbLevel => dbLevel.domainId, dbLevel => dbLevel.value);
	}

	protected async postWriteProcessing(data: PostWriteProcessingData<DB_PermissionGroup>) {
		const deleted = data.deleted ? (Array.isArray(data.deleted) ? data.deleted : [data.deleted]) : [];
		const updated = data.updated ? (Array.isArray(data.updated) ? data.updated : [data.updated]) : [];
		const groupIds = filterDuplicates([...deleted, ...updated].map(dbObjectToId));
		const users = await batchActionParallel(groupIds, 10, async ids => await ModuleBE_PermissionUserDB.query.custom({where: {__groupIds: {$aca: ids}}}));
		await ModuleBE_SessionDB.session.invalidate(filterDuplicates(users.map(i => i._id)));
	}
}

export const ModuleBE_PermissionGroupDB = new ModuleBE_PermissionGroupDB_Class();
