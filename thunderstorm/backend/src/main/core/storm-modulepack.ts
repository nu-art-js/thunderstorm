import {Module} from '@nu-art/ts-common';
import {ModuleBE_SyncManager} from '../modules/sync-manager/ModuleBE_SyncManager.js';
import {ModuleBE_APIs} from '../modules/ModuleBE_APIs.js';
import {ModuleBE_SyncEnv} from '../modules/sync-env/ModuleBE_SyncEnv.js';
import {ModuleBE_ActionProcessor} from '../modules/action-processor/ModuleBE_ActionProcessor.js';
import {ModuleBE_ServerInfo} from '../modules/ModuleBE_ServerInfo.js';
import {ModulePackBE_AppConfigDB} from '../../_entity/app-config/backend/index.js';
import {ModulePackBE_BackupDocDB} from '../../_entity/backup-doc/backend/index.js';
import { ModuleBE_CollectionActions } from '../modules/collection-actions/ModuleBE_CollectionActions.js';

export const ModulePack_ThunderstormBE: Module[] = [
	ModuleBE_ServerInfo,
	ModuleBE_SyncManager,
	ModuleBE_APIs,
	ModuleBE_SyncEnv,
	ModuleBE_ActionProcessor,
	ModuleBE_CollectionActions,
	// ...ModulePackBE_EditableTest,
	...ModulePackBE_AppConfigDB,
	...ModulePackBE_BackupDocDB,
];

export const ModulePackBE_Thunderstorm = ModulePack_ThunderstormBE;