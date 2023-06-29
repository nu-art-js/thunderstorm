import {ThunderDispatcher} from "@nu-art/thunderstorm/frontend";
import {OnSyncStatusChangedListener} from "./types";
import {DB_Object} from "@nu-art/ts-common";

export enum SyncStatus {
	loading,
	idle,
	read,
	write
}

export enum DataStatus {
	NoData,
	containsData,
}

export const syncDispatcher: ThunderDispatcher<OnSyncStatusChangedListener<DB_Object>, '__onSyncStatusChanged'> = new ThunderDispatcher<OnSyncStatusChangedListener<DB_Object>, '__onSyncStatusChanged'>('__onSyncStatusChanged');
