import {DBApiConfigV3, ModuleBE_BaseDBV3, ServerApi,} from '@nu-art/thunderstorm/backend';
import {DBDef_PermissionAPI, DBProto_PermissionAPI, DB_PermissionAPI} from '../shared';
import {_keys, ApiException, dbObjectToId, filterInstances, PreDB, TypedMap} from '@nu-art/ts-common';
import {ModuleBE_PermissionAccessLevelDB} from '../../permission-access-level/backend/ModuleBE_PermissionAccessLevelDB';
import {Transaction} from 'firebase-admin/firestore';
import {MemKey_AccountId} from '@nu-art/user-account/backend';
import {ModuleBE_PermissionProjectDB} from '../../permission-project/backend/ModuleBE_PermissionProjectDB';


type Config = DBApiConfigV3<DBProto_PermissionAPI> & {}

export class ModuleBE_PermissionAPIDB_Class
	extends ModuleBE_BaseDBV3<DBProto_PermissionAPI, Config> {

	constructor() {
		super(DBDef_PermissionAPI);
	}

	protected async preWriteProcessing(instance: DB_PermissionAPI, t?: Transaction) {
		await ModuleBE_PermissionProjectDB.query.uniqueAssert(instance.projectId);

		instance._auditorId = MemKey_AccountId.get();
		if (!instance.accessLevelIds?.length)
			return;

		// Check if any Domains appear more than once in this group
		const duplicationMap = instance.accessLevelIds.reduce<TypedMap<number>>((map, accessLevelId) => {

			if (map[accessLevelId] === undefined)
				map[accessLevelId] = 0;
			else
				map[accessLevelId]++;

			return map;
		}, {});

		const duplicateAccessLevelIds: string[] = filterInstances(_keys(duplicationMap)
			.map(accessLevelId => duplicationMap[accessLevelId] > 1 ? accessLevelId : undefined) as string[]);
		if (duplicateAccessLevelIds.length)
			throw new ApiException(400, `Trying to create API with duplicate access levels: ${duplicateAccessLevelIds}`);

		// Verify all AccessLevels actually exist
		const dbAccessLevels = filterInstances(await ModuleBE_PermissionAccessLevelDB.query.all(instance.accessLevelIds));
		if (dbAccessLevels.length !== instance.accessLevelIds.length) {
			const dbAccessLevelIds = dbAccessLevels.map(dbObjectToId);
			throw new ApiException(404, `Asked to assign an api non existing accessLevels: ${instance.accessLevelIds.filter(id => !dbAccessLevelIds.includes(id))}`);
		}

		dbAccessLevels.forEach(accessLevel => {
			if (!instance._accessLevels)
				instance._accessLevels = {};
			instance._accessLevels[accessLevel.domainId] = accessLevel.value;
		});
	}

	registerApis(projectId: string, routes: string[]) {
		return this.runTransaction(async (transaction: Transaction) => {
			const existingProjectApis = await this.query.custom({where: {projectId: projectId}}, transaction);
			const apisToAdd: PreDB<DB_PermissionAPI>[] = routes
				.filter(path => !existingProjectApis.find(api => api.path === path))
				.map(path => ({path, projectId: projectId, _auditorId: MemKey_AccountId.get()}));

			return this.set.all(apisToAdd, transaction);
		});
	}

	apiUpsert(): ServerApi<any> | undefined {
		return;
	}
}

export const ModuleBE_PermissionAPIDB = new ModuleBE_PermissionAPIDB_Class();
