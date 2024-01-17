import {DB_Object, TypedMap} from '@nu-art/ts-common';
import {BodyApi, QueryApi} from '../types';

export type LastUpdated = { lastUpdated: number, oldestDeleted?: number };
export type SyncDataFirebaseState = TypedMap<LastUpdated>
export type DBSyncData_OLD = { name: string, lastUpdated: number, oldestDeleted?: number };
export type Response_DBSyncData = { syncData: DBSyncData_OLD[] };
export type Response_DBSync<DBType extends DB_Object> = { toUpdate: DBType[], toDelete: DB_Object[] };

export type SyncDbData = {
	dbName: string,
	lastUpdated: number
};
export type Request_SmartSync = {
	modules: SyncDbData[]
}

export const SmartSync_UpToDateSync = 'up-to-date' as const;
export const SmartSync_FullSync = 'full' as const;
export const SmartSync_DeltaSync = 'delta-sync' as const;

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
export type Response_SmartSync = {
	modules: (NoNeedToSyncModule | DeltaSyncModule | FullSyncModule)[]
}

export type ApiStruct_SyncManager = {
	v1: {
		checkSync: QueryApi<Response_DBSyncData, undefined>
		smartSync: BodyApi<Response_SmartSync, Request_SmartSync>
	},
}

