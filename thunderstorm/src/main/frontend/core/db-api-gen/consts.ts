import {ThunderDispatcher} from '../thunder-dispatcher';
import {OnSyncStatusChangedListener} from './v3_types';


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

export const syncDispatcher: ThunderDispatcher<OnSyncStatusChangedListener<any>, '__onSyncStatusChanged'> = new ThunderDispatcher<OnSyncStatusChangedListener<any>, '__onSyncStatusChanged'>('__onSyncStatusChanged');

export const EventType_UpsertAll = 'upsert-all';
export const EventType_Create = 'create';
export const EventType_Update = 'update';
export const EventType_Patch = 'patch';
export const EventType_Unique = 'unique';
export const EventType_Query = 'query';
export const EventType_Delete = 'delete';
export const EventType_DeleteMulti = 'delete-multi';