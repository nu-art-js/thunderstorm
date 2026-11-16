/**
 * Public RTDB paths. The frontend listens here. The backend writes here.
 * Example: publicSyncDataPath('ModuleBE_SyncManager') === '/public/state/ModuleBE_SyncManager/syncData'
 */

/** Private module node. Holds deletedCount. Example: privateModuleStatePath('ModuleBE_SyncManager') */
export const privateModuleStatePath = (moduleName: string): string =>
	`/state/${moduleName}`;

/** Public module node. Example: publicModuleStatePath('ModuleBE_SyncManager') */
export const publicModuleStatePath = (moduleName: string): string =>
	`/public/state/${moduleName}`;

/** Public collection stamps. Example: publicSyncDataPath('ModuleBE_SyncManager') */
export const publicSyncDataPath = (moduleName: string): string =>
	`${publicModuleStatePath(moduleName)}/syncData`;

/** Default listener path. Example: '/public/state/ModuleBE_SyncManager/syncData' */
export const Default_SyncManagerNodePath = publicSyncDataPath('ModuleBE_SyncManager');
