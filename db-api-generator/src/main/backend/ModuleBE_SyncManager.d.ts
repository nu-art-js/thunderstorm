import { FirestoreQuery } from '@nu-art/firebase';
import { FirestoreCollection, FirestoreTransaction } from '@nu-art/firebase/backend';
import { OnModuleCleanup } from '@nu-art/thunderstorm/backend';
import { DB_Object, Module } from '@nu-art/ts-common';
type DeletedDBItem = DB_Object & {
    __collectionName: string;
};
type Config = {
    retainDeletedCount: number;
};
export declare class ModuleBE_SyncManager_Class extends Module<Config> implements OnModuleCleanup {
    collection: FirestoreCollection<DeletedDBItem>;
    private database;
    private dbModules;
    private syncData;
    private deletedCount;
    checkSyncApi: import("@nu-art/thunderstorm/backend")._ServerQueryApi<import("@nu-art/thunderstorm").QueryApi<import("../shared").Response_DBSyncData, undefined>>;
    constructor();
    private prepareItemToDelete;
    onItemsDeleted(collectionName: string, items: DB_Object[], uniqueKeys: string[] | undefined, transaction: FirestoreTransaction): Promise<void>;
    queryDeleted(collectionName: string, query: FirestoreQuery<DB_Object>, transaction: FirestoreTransaction): Promise<DeletedDBItem[]>;
    __onCleanupInvoked: () => Promise<void>;
    init(): void;
    private fetchDBSyncData;
    setLastUpdated(collectionName: string, lastUpdated: number): Promise<void>;
    setOldestDeleted(collectionName: string, oldestDeleted: number): Promise<void>;
}
export declare const ModuleBE_SyncManager: ModuleBE_SyncManager_Class;
export {};
