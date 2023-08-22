import {Module} from '@nu-art/ts-common';
import {ApiDef_SyncEnvV2, ApiDefCaller, ApiStruct_SyncEnvV2} from '../../shared';
import {apiWithBody, apiWithQuery} from '../../core';


class ModuleFE_SyncEnvV2_Class
	extends Module {

	readonly vv1: ApiDefCaller<ApiStruct_SyncEnvV2>['vv1'];

	constructor() {
		super();
		this.vv1 = {
			fetchFromEnv: apiWithBody(ApiDef_SyncEnvV2.vv1.fetchFromEnv),
			createBackup: apiWithQuery(ApiDef_SyncEnvV2.vv1.createBackup),
			fetchBackupMetadata: apiWithQuery(ApiDef_SyncEnvV2.vv1.fetchBackupMetadata),
			fetchFirebaseBackup: apiWithQuery(ApiDef_SyncEnvV2.vv1.fetchFirebaseBackup)
		};
	}
}

export const ModuleFE_SyncEnvV2 = new ModuleFE_SyncEnvV2_Class();