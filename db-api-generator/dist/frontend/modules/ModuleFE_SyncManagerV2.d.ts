import { ApiDefCaller } from '@nu-art/thunderstorm';
import { Module } from '@nu-art/ts-common';
import { ApiStruct_SyncManager, Response_DBSyncData } from '../../shared';
export declare class ModuleFE_SyncManagerV2_Class extends Module implements ApiDefCaller<ApiStruct_SyncManager> {
    readonly v1: {
        checkSync: () => import("@nu-art/thunderstorm").BaseHttpRequest<import("@nu-art/thunderstorm").QueryApi<Response_DBSyncData, undefined>>;
    };
    constructor();
    onReceivedSyncData: (response: Response_DBSyncData) => Promise<void>;
}
export declare const ModuleFE_SyncManagerV2: ModuleFE_SyncManagerV2_Class;
