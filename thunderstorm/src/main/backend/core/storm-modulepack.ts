import {Module} from '@thunder-storm/common';
import {ModuleBE_UpgradeCollection} from '../modules/upgrade-collection/ModuleBE_UpgradeCollection';
import {ModuleBE_SyncManager} from '../modules/sync-manager/ModuleBE_SyncManager';
import {ModuleBE_APIs} from '../modules/ModuleBE_APIs';
import {ModuleBE_SyncEnv} from '../modules/sync-env/ModuleBE_SyncEnv';
import {ModuleBE_ActionProcessor} from '../modules/action-processor/ModuleBE_ActionProcessor';
import {ModuleBE_ServerInfo} from '../modules/ModuleBE_ServerInfo';
import {ModulePackBE_AppConfigDB} from '../../_entity/app-config/backend';
import {ModulePackBE_BackupDocDB} from '../../_entity/backup-doc/backend';

export const ModulePack_ThunderstormBE: Module[] = [
	ModuleBE_ServerInfo,
	ModuleBE_SyncManager,
	ModuleBE_APIs,
	ModuleBE_SyncEnv,
	ModuleBE_ActionProcessor,
	ModuleBE_UpgradeCollection,
	// ...ModulePackBE_EditableTest,
	...ModulePackBE_AppConfigDB,
	...ModulePackBE_BackupDocDB,
];

export const ModulePackBE_Thunderstorm = ModulePack_ThunderstormBE;