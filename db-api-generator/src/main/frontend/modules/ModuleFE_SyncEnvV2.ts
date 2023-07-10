import {ApiDefCaller} from '@nu-art/thunderstorm';
import {apiWithBody, apiWithQuery} from '@nu-art/thunderstorm/frontend';
import {Module} from '@nu-art/ts-common';
import {ApiDef_SyncEnvV2, ApiStruct_SyncEnvV2} from '../shared';


class ModuleFE_SyncEnvV2_Class
    extends Module {

    readonly vv1: ApiDefCaller<ApiStruct_SyncEnvV2>['vv1'];

    constructor() {
        super();
        this.vv1 = {
            fetchFromEnv: apiWithBody(ApiDef_SyncEnvV2.vv1.fetchFromEnv),
            createBackup: apiWithQuery(ApiDef_SyncEnvV2.vv1.createBackup),
            fetchBackupMetadata: apiWithQuery(ApiDef_SyncEnvV2.vv1.fetchBackupMetadata)
        };
    }
}

export const ModuleFE_SyncEnvV2 = new ModuleFE_SyncEnvV2_Class();