import {Module} from '@nu-art/ts-common';
import {ModuleBE_UpgradeCollection} from '../modules/upgrade-collection/ModuleBE_UpgradeCollection';
import {ModuleBE_SyncManager} from '../modules/sync-manager/ModuleBE_SyncManager';
import {ModuleBE_APIs} from '../modules/ModuleBE_APIs';
import {ModuleBE_v2_Backup} from '../modules/backup/ModuleBE_v2_Backup';
import {ModuleBE_v2_SyncEnv} from '../modules/sync-env/ModuleBE_v2_SyncEnv';
import {ModuleBE_v2_BackupScheduler} from '../modules/backup/ModuleBE_v2_BackupScheduler';
import {ModuleBE_ActionProcessor} from '../modules/action-processor/ModuleBE_ActionProcessor';
import {ModuleBE_ServerInfo} from '../modules/ModuleBE_ServerInfo';
import {ModuleBE_AppConfig} from '../modules/app-config/ModuleBE_AppConfig';
import {createApisForDBModuleV2} from '../modules/db-api-gen/ModuleBE_BaseApiV2';
import {ModulePackBE_EditableTest} from '../../_entity/editable-test/backend/module-pack';


export const ModuleBE_AppConfigApi = createApisForDBModuleV2(ModuleBE_AppConfig);

export const ModulePack_ThunderstormBE: Module[] = [
	ModuleBE_ServerInfo,
	ModuleBE_SyncManager,
	ModuleBE_AppConfig, ModuleBE_AppConfigApi,
	ModuleBE_APIs,
	ModuleBE_v2_Backup,
	ModuleBE_v2_SyncEnv,
	ModuleBE_v2_BackupScheduler,
	ModuleBE_ActionProcessor,
	ModuleBE_UpgradeCollection,
	...ModulePackBE_EditableTest
];

export const ModulePackBE_Thunderstorm = ModulePack_ThunderstormBE;