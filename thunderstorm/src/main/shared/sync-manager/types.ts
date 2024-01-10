import {DB_Object} from '@nu-art/ts-common';
import {BodyApi, QueryApi} from '../types';


export type DBSyncData = { name: string, lastUpdated: number, oldestDeleted?: number };
export type Response_DBSyncData = { syncData: DBSyncData[] };
export type Response_DBSync<DBType extends DB_Object> = { toUpdate: DBType[], toDelete: DB_Object[] };

export type Request_SmartSync = {
	modules: {
		name: string,
		lastUpdated: number
	}[]
}

export const SmartSync_FullSync = 'full' as const;
export const SmartSync_DeltaSync = 'delta-sync' as const;

export type SmartSync_Type = typeof SmartSync_FullSync | typeof SmartSync_DeltaSync
export type Response_SmartSync = {
	modules: {
		name: string,
		sync: SmartSync_Type
		items?: Response_DBSync<any>
	}[]
}

export type ApiStruct_SyncManager = {
	v1: {
		checkSync: QueryApi<Response_DBSyncData, undefined>
		smartSync: BodyApi<Response_SmartSync, Request_SmartSync>
	},
}

