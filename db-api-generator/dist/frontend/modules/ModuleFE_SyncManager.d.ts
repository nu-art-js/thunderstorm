import { ApiDefCaller } from '@nu-art/thunderstorm';
import { Dispatcher, Module } from '@nu-art/ts-common';
import { ApiStruct_SyncManager, DBSyncData, Response_DBSyncData } from '../../shared';
export type SyncIfNeeded = {
    __syncIfNeeded: (syncData: DBSyncData[]) => Promise<void>;
};
export type OnSyncCompleted = {
    __onSyncCompleted: () => void;
};
export declare const dispatch_syncIfNeeded: Dispatcher<SyncIfNeeded, "__syncIfNeeded", [syncData: DBSyncData[]], void>;
export declare const dispatch_onSyncCompleted: Dispatcher<OnSyncCompleted, "__onSyncCompleted", [], void>;
export declare class ModuleFE_SyncManager_Class extends Module implements ApiDefCaller<ApiStruct_SyncManager> {
    readonly v1: {
        checkSync: () => import("@nu-art/thunderstorm").BaseHttpRequest<import("@nu-art/thunderstorm").QueryApi<Response_DBSyncData, undefined>>;
    };
    constructor();
    onReceivedSyncData: (response: Response_DBSyncData) => Promise<void>;
}
export declare const ModuleFE_SyncManager: ModuleFE_SyncManager_Class;
