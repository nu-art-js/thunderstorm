import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DB_PermissionAPI, DBDef_PermissionAPI, DatabaseDef_PermissionAPI} from '@nu-art/permissions-shared';
import {dbObjectToId, filterInstances, PreDB, UniqueId} from '@nu-art/ts-common';
import {ModuleBE_PermissionAccessLevelDB} from '../permission-access-level/index.js';
import {Transaction} from 'firebase-admin/firestore';
import {MemKey_AccountId} from '@nu-art/user-account-backend';
import {ModuleBE_PermissionProjectDB} from '../permission-project/index.js';
import {HttpCodes} from '@nu-art/ts-common/core/exceptions/http-codes';
import {trimStartingForwardSlash} from '@nu-art/thunderstorm-shared/route-tools';

export class ModuleBE_PermissionAPIDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_PermissionAPI> {

	constructor() {
		super(DBDef_PermissionAPI);

		this.registerVersionUpgradeProcessor('1.0.0', async instances => {
		}); // adjustment made in pre-write requires us to do this in order to upgrade the data
	}

	protected async preWriteProcessing(instance: DB_PermissionAPI, originalDbInstance: DatabaseDef_PermissionAPI['dbType'], t?: Transaction) {
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

	apiUpsert(): unknown {
		return;
	}
}

export const ModuleBE_PermissionAPIDB = new ModuleBE_PermissionAPIDB_Class();
