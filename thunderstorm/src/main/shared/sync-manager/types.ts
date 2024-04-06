import {DB_Object, TypedMap} from '@nu-art/ts-common';


export type LastUpdated = { lastUpdated: number, oldestDeleted?: number };
export type SyncDataFirebaseState = TypedMap<LastUpdated>
export type Response_DBSync<DBType extends DB_Object> = { toUpdate: DBType[], toDelete: DB_Object[] };
export type ApiStruct_SyncManager = {}
export type SyncDbData = {
	dbKey: string,
	lastUpdated: number
};

export type Request_SmartSync = {
	modules: SyncDbData[]
}

export type Response_SmartSync = {
	modules: (NoNeedToSyncModule | DeltaSyncModule | FullSyncModule)[]
}

export const SmartSync_UpToDateSync = 'up-to-date' as const;
export const SmartSync_DeltaSync = 'delta-sync' as const;
export const SmartSync_FullSync = 'full' as const;

export type NoNeedToSyncModule = SyncDbData & {
	sync: typeof SmartSync_UpToDateSync
};

export type DeltaSyncModule = SyncDbData & {
	sync: typeof SmartSync_DeltaSync
	items: Response_DBSync<any>
};

export type FullSyncModule = SyncDbData & {
	sync: typeof SmartSync_FullSync
};

export type SmartSync_SyncGroups = {
	[SmartSync_UpToDateSync]: NoNeedToSyncModule[];
	[SmartSync_DeltaSync]: DeltaSyncModule[];
	[SmartSync_FullSync]: FullSyncModule[];
}