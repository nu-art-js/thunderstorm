import {Module} from '@nu-art/ts-common';
import {ApiDef_SyncEnv, ApiDefCaller, ApiStruct_SyncEnv} from '../../shared';
import {apiWithBody, apiWithQuery} from '../../core/typed-api';


class ModuleFE_SyncEnvV2_Class
	extends Module {

	readonly vv1: ApiDefCaller<ApiStruct_SyncEnv>['vv1'];

	constructor() {
		super();
		this.vv1 = {
			syncToEnv: apiWithBody(ApiDef_SyncEnv.vv1.syncToEnv),
			syncFromEnvBackup: apiWithBody(ApiDef_SyncEnv.vv1.syncFromEnvBackup),
			createBackup: apiWithQuery(ApiDef_SyncEnv.vv1.createBackup),
			fetchBackupMetadata: apiWithQuery(ApiDef_SyncEnv.vv1.fetchBackupMetadata),
			syncFirebaseFromBackup: apiWithQuery(ApiDef_SyncEnv.vv1.syncFirebaseFromBackup)
		};
	}
}

export const ModuleFE_SyncEnvV2 = new ModuleFE_SyncEnvV2_Class();