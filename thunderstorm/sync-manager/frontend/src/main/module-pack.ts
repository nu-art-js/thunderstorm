import {Module} from '@nu-art/ts-common';
import {ModuleFE_SyncManager} from './modules/sync-manager/ModuleFE_SyncManager.js';
import {ModuleFE_SyncManager_CSV} from './modules/sync-manager/ModuleFE_SyncManager_CSV.js';

export const ModulePackFE_SyncManager: Module[] = [
	ModuleFE_SyncManager,
	ModuleFE_SyncManager_CSV,
];
