import {OnSyncStatusChangedListener} from './types';
import {DB_Object} from '@nu-art/ts-common';
import {ThunderDispatcher} from '../thunder-dispatcher';


export enum SyncStatus {
	loading,
	idle,
	read,
	write
}

export enum DataStatus {
	NoData, //no render
	UpdatingData, //no render
	ContainsData, //render
	// UpdatingDelta, //render
	// UpToDate//render
}

export const syncDispatcher: ThunderDispatcher<OnSyncStatusChangedListener<DB_Object>, '__onSyncStatusChanged'> = new ThunderDispatcher<OnSyncStatusChangedListener<DB_Object>, '__onSyncStatusChanged'>('__onSyncStatusChanged');

export const EventType_UpsertAll = 'upsert-all';
export const EventType_Create = 'create';
export const EventType_Update = 'update';
export const EventType_Patch = 'patch';
export const EventType_Unique = 'unique';
export const EventType_Query = 'query';
export const EventType_Delete = 'delete';
export const EventType_DeleteMulti = 'delete-multi';