import {Module} from '@nu-art/ts-common';
import {ApiDef_SyncEnvV2, ApiDefCaller, ApiStruct_SyncEnvV2} from '../../shared';
import {apiWithBody, apiWithQuery} from '../../core/typed-api';


class ModuleFE_SyncEnvV2_Class
	extends Module {

	readonly vv1: ApiDefCaller<ApiStruct_SyncEnvV2>['vv1'];

	constructor() {
		super();
		this.vv1 = {
			syncToEnv: apiWithBody(ApiDef_SyncEnvV2.vv1.syncToEnv),
			syncFromEnvBackup: apiWithBody(ApiDef_SyncEnvV2.vv1.syncFromEnvBackup),
			createBackup: apiWithQuery(ApiDef_SyncEnvV2.vv1.createBackup),
			fetchBackupMetadata: apiWithQuery(ApiDef_SyncEnvV2.vv1.fetchBackupMetadata),
			syncFirebaseFromBackup: apiWithQuery(ApiDef_SyncEnvV2.vv1.syncFirebaseFromBackup)
		};
	}
}

export const ModuleFE_SyncEnvV2 = new ModuleFE_SyncEnvV2_Class();