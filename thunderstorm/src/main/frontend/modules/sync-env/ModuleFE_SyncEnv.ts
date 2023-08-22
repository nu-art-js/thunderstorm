import {Module} from '@nu-art/ts-common';
import {ApiDef_SyncEnv, ApiDefCaller, ApiStruct_SyncEnv} from '../../shared';
import {apiWithBody, apiWithQuery} from '../../core';


class ModuleFE_SyncEnv_Class
	extends Module {

	readonly vv1: ApiDefCaller<ApiStruct_SyncEnv>['vv1'];

	constructor() {
		super();
		this.vv1 = {
			fetchFromEnv: apiWithBody(ApiDef_SyncEnv.vv1.fetchFromEnv),
			createBackup: apiWithQuery(ApiDef_SyncEnv.vv1.createBackup),
			fetchBackupMetadata: apiWithQuery(ApiDef_SyncEnv.vv1.fetchBackupMetadata),
		};
	}
}

export const ModuleFE_SyncEnv = new ModuleFE_SyncEnv_Class();