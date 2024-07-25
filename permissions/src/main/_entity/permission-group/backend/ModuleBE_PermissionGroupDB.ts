import {DBApiConfigV3, ModuleBE_ActionProcessor, ModuleBE_BaseDB,} from '@nu-art/thunderstorm/backend';
import {DB_PermissionGroup, DBDef_PermissionGroup, DBProto_PermissionGroup} from './shared';
import {_keys, ApiException, batchActionParallel, dbObjectToId, filterDuplicates, filterInstances, reduceToMap, TypedMap} from '@nu-art/ts-common';
import {ModuleBE_PermissionAccessLevelDB} from '../../permission-access-level/backend';
import {Transaction} from 'firebase-admin/firestore';
import {MemKey_AccountId, ModuleBE_SessionDB, SlackReporter} from '@nu-art/user-account/backend';
import {ModuleBE_PermissionUserDB} from '../../permission-user/backend';
import {CollectionActionType, PostWriteProcessingData} from '@nu-art/firebase/backend/firestore-v3/FirestoreCollectionV3';
import {_EmptyQuery} from '@nu-art/firebase';


type Config = DBApiConfigV3<DBProto_PermissionGroup> & {}

export class ModuleBE_PermissionGroupDB_Class
	extends ModuleBE_BaseDB<DBProto_PermissionGroup, Config> {

	constructor() {
		super(DBDef_PermissionGroup);
		ModuleBE_ActionProcessor.registerAction({
			key: 'clear-unused-permission-groups',
			group: 'Permissions',
			description: 'Clears all permission groups that aren\'t in use',
			processor: this.clearUnused
		}, this);
	}

	protected async preWriteProcessing(instance: DB_PermissionGroup, originalDbInstance: DBProto_PermissionGroup['dbType'], t?: Transaction) {
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
			throw new ApiException(400, `Can't add a group with more than one access level per domain: ${duplicateDomainIds}, group: ${instance.label}`);

		instance._levelsMap = reduceToMap(dbLevels, dbLevel => dbLevel.domainId, dbLevel => dbLevel.value);
	}

	protected async postWriteProcessing(data: PostWriteProcessingData<DBProto_PermissionGroup>, actionType: CollectionActionType) {
		const deleted = data.deleted ? (Array.isArray(data.deleted) ? data.deleted : [data.deleted]) : [];
		const updated = data.updated ? (Array.isArray(data.updated) ? data.updated : [data.updated]) : [];
		const groupIds = filterDuplicates([...deleted, ...updated].map(dbObjectToId));
		const users = await batchActionParallel(groupIds, 10, async ids => await ModuleBE_PermissionUserDB.query.custom({where: {__groupIds: {$aca: ids}}}));
		await ModuleBE_SessionDB.session.invalidate(filterDuplicates(users.map(i => i._id)));
	}

	private clearUnused = async () => {
		let report = 'Report for refactor action *Clean Unused Permission Groups*:\n\n';
		const allPermissionUsers = await ModuleBE_PermissionUserDB.query.custom(_EmptyQuery);
		const allGroups = await this.query.custom(_EmptyQuery);
		const usedGroupIds = allPermissionUsers.map(user => user.__groupIds ?? []).flat();
		const unusedGroups = allGroups.filter(group => !usedGroupIds.includes(group._id));
		report += `Cleared ${unusedGroups.length} groups: ${unusedGroups.map(group => group.label).join(',\n')}`;
		await this.delete.allItems(unusedGroups);
		await new SlackReporter(report).sendReportToChannel();
	};
}

export const ModuleBE_PermissionGroupDB = new ModuleBE_PermissionGroupDB_Class();