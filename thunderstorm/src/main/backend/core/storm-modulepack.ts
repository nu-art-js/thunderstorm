import {Module} from '@nu-art/ts-common';
import {ModuleBE_UpgradeCollection} from '../modules/upgrade-collection/ModuleBE_UpgradeCollection';
import {ModuleBE_v2_SyncManager} from '../modules/sync-manager/ModuleBE_v2_SyncManager';
import {ModuleBE_APIs} from '../modules/ModuleBE_APIs';
import {ModuleBE_v2_Backup} from '../modules/backup/ModuleBE_v2_Backup';
import {ModuleBE_v2_SyncEnv} from '../modules/sync-env/ModuleBE_v2_SyncEnv';
import {ModuleBE_v2_BackupScheduler} from '../modules/backup/ModuleBE_v2_BackupScheduler';
import {ModuleBE_ActionProcessor} from '../modules/action-processor/ModuleBE_ActionProcessor';


export const ModulePack_ThunderstormBE: Module[] = [
	ModuleBE_v2_SyncManager,
	ModuleBE_APIs,
	ModuleBE_v2_Backup,
	ModuleBE_v2_SyncEnv,
	ModuleBE_v2_BackupScheduler,
	ModuleBE_ActionProcessor,
	ModuleBE_UpgradeCollection,
];

