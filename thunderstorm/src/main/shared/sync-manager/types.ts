import {DB_Object, TypedMap} from '@nu-art/ts-common';
import {BodyApi, QueryApi} from '../types';

export type LastUpdated = { lastUpdated: number, oldestDeleted?: number };
export type Type_SyncData = TypedMap<LastUpdated>
export type DBSyncData = { name: string, lastUpdated: number, oldestDeleted?: number };
export type Response_DBSyncData = { syncData: DBSyncData[] };
export type Response_DBSync<DBType extends DB_Object> = { toUpdate: DBType[], toDelete: DB_Object[] };

export type Request_SmartSync = {
	modules: {
		dbName: string,
		lastUpdated: number
	}[]
}

export const SmartSync_UpToDateSync = 'up-to-date' as const;
export const SmartSync_FullSync = 'full' as const;
export const SmartSync_DeltaSync = 'delta-sync' as const;

export type NoNeedToSyncModule = {
	dbName: string,
	sync: typeof SmartSync_UpToDateSync
	lastUpdated: number
};
export type DeltaSyncModule = {
	dbName: string,
	sync: typeof SmartSync_DeltaSync
	items: Response_DBSync<any>
	lastUpdated: number
};
export type FullSyncModule = {
	dbName: string,
	sync: typeof SmartSync_FullSync
	lastUpdated: number
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

