import {Module} from '@nu-art/ts-common';
import {ModuleBE_UpgradeCollection} from '../modules/upgrade-collection/ModuleBE_UpgradeCollection';
import {ModuleBE_SyncManager} from '../modules/sync-manager/ModuleBE_SyncManager';
import {ModuleBE_APIs} from '../modules/ModuleBE_APIs';
import {ModuleBE_v2_Backup} from '../modules/backup/ModuleBE_v2_Backup';
import {ModuleBE_v2_SyncEnv} from '../modules/sync-env/ModuleBE_v2_SyncEnv';
import {ModuleBE_v2_BackupScheduler} from '../modules/backup/ModuleBE_v2_BackupScheduler';
import {ModuleBE_ActionProcessor} from '../modules/action-processor/ModuleBE_ActionProcessor';
import {ModuleBE_ServerInfo} from '../modules/ModuleBE_ServerInfo';
import {ModulePackBE_AppConfigDB} from '../../_entity/app-config/backend';

export const ModulePack_ThunderstormBE: Module[] = [
	ModuleBE_ServerInfo,
	ModuleBE_SyncManager,
	ModuleBE_APIs,
	ModuleBE_v2_Backup,
	ModuleBE_v2_SyncEnv,
	ModuleBE_v2_BackupScheduler,
	ModuleBE_ActionProcessor,
	ModuleBE_UpgradeCollection,
	// ...ModulePackBE_EditableTest,
	...ModulePackBE_AppConfigDB,

];

export const ModulePackBE_Thunderstorm = ModulePack_ThunderstormBE;