import {DBApiConfigV3, ModuleBE_BaseDB, ServerApi,} from '@thunder-storm/core/backend';
import {DB_PermissionAPI, DBDef_PermissionAPI, DBProto_PermissionAPI} from '../shared';
import {dbObjectToId, filterInstances, PreDB, UniqueId} from '@thunder-storm/common';
import {ModuleBE_PermissionAccessLevelDB} from '../../permission-access-level/backend/ModuleBE_PermissionAccessLevelDB';
import {Transaction} from 'firebase-admin/firestore';
import {MemKey_AccountId} from '@thunder-storm/user-account/backend';
import {ModuleBE_PermissionProjectDB} from '../../permission-project/backend/ModuleBE_PermissionProjectDB';
import {HttpCodes} from '@thunder-storm/common/core/exceptions/http-codes';
import {trimStartingForwardSlash} from '@thunder-storm/core/shared/route-tools';


type Config = DBApiConfigV3<DBProto_PermissionAPI> & {}

export class ModuleBE_PermissionAPIDB_Class
	extends ModuleBE_BaseDB<DBProto_PermissionAPI, Config> {

	constructor() {
		super(DBDef_PermissionAPI);

		this.registerVersionUpgradeProcessor('1.0.0', async instances => {
		}); // adjustment made in pre-write requires us to do this in order to upgrade the data
	}

	protected async preWriteProcessing(instance: DB_PermissionAPI, originalDbInstance: DBProto_PermissionAPI['dbType'], t?: Transaction) {
		await ModuleBE_PermissionProjectDB.query.uniqueAssert(instance.projectId);

		// clean '/' from api path start
		instance.path = trimStartingForwardSlash(instance.path);
		// set who created this
		instance._auditorId = MemKey_AccountId.get();
		const accessLevelIds = new Set<UniqueId>();
		const duplicateAccessLevelIds = new Set<UniqueId>();

		//Check for duplicated Unique IDs
		instance.accessLevelIds?.forEach(id => {
			const duplicate = accessLevelIds.has(id);
			accessLevelIds.add(id);
			if (duplicate)
				duplicateAccessLevelIds.add(id);
		});
		if (duplicateAccessLevelIds.size)
			throw HttpCodes._4XX.BAD_REQUEST('Could not update permission api', `Trying to create API with duplicate access levels: ${duplicateAccessLevelIds}`);

		// Verify all AccessLevels actually exist, and assign _accessLevels
		if (instance.accessLevelIds?.length) {
			const dbAccessLevels = filterInstances(await ModuleBE_PermissionAccessLevelDB.query.all(instance.accessLevelIds));
			if (dbAccessLevels.length !== instance.accessLevelIds.length) {
				const dbAccessLevelIds = dbAccessLevels.map(dbObjectToId);
				throw HttpCodes._4XX.NOT_FOUND('Could not update permission api', `Asked to assign an api non existing accessLevels: ${instance.accessLevelIds.filter(id => !dbAccessLevelIds.includes(id))}`);
			}
			dbAccessLevels.forEach(accessLevel => {
				if (!instance._accessLevels)
					instance._accessLevels = {};
				instance._accessLevels[accessLevel.domainId] = accessLevel.value;
			});
		} else {
			instance._accessLevels = {};
		}
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
