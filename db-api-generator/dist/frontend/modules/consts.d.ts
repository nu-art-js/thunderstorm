import { ThunderDispatcher } from '@nu-art/thunderstorm/frontend';
import { OnSyncStatusChangedListener } from './types';
import { DB_Object } from '@nu-art/ts-common';
export declare enum SyncStatus {
    loading = 0,
    idle = 1,
    read = 2,
    write = 3
}
export declare enum DataStatus {
    NoData = 0,
    UpdatingData = 1,
    ContainsData = 2
}
export declare const syncDispatcher: ThunderDispatcher<OnSyncStatusChangedListener<DB_Object>, '__onSyncStatusChanged'>;
