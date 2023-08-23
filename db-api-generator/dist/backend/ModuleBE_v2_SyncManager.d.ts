import { FirestoreQuery } from '@nu-art/firebase';
import { DB_Object, DBDef, Module, UniqueId } from '@nu-art/ts-common';
import { FirestoreCollectionV2 } from '@nu-art/firebase/backend/firestore-v2/FirestoreCollectionV2';
import { firestore } from 'firebase-admin';
import Transaction = firestore.Transaction;
import { OnModuleCleanupV2 } from '@nu-art/thunderstorm/backend/modules/backup/ModuleBE_v2_BackupScheduler';
type DeletedDBItem = DB_Object & {
    __collectionName: string;
    __docId: UniqueId;
};
type Config = {
    retainDeletedCount: number;
};
/**
 * # ModuleBE_SyncManager
 *
 * ## <ins>Description:</ins>
 * This module manages all the {@link BaseDB_Module} updates and deleted items in order to allow incremental sync of items with clients
 *
 * ## <ins>Config:</ins>
 *
 * ```json
 * "ModuleBE_SyncManager" : {
 *   	retainDeletedCount: 100
 * }
 * ```
 */
export declare class ModuleBE_v2_SyncManager_Class extends Module<Config> implements OnModuleCleanupV2 {
    collection: FirestoreCollectionV2<DeletedDBItem>;
    private database;
    private dbModules;
    private syncData;
    private deletedCount;
    checkSyncApi: import("@nu-art/thunderstorm/backend")._ServerQueryApi<import("@nu-art/thunderstorm").QueryApi<import("../shared").Response_DBSyncData, undefined>>;
    constructor();
    init(): void;
    private prepareItemToDelete;
    onItemsDeleted(collectionName: string, items: DB_Object[], uniqueKeys?: string[], transaction?: Transaction): Promise<void>;
    queryDeleted(collectionName: string, query: FirestoreQuery<DB_Object>): Promise<DeletedDBItem[]>;
    __onCleanupInvokedV2: () => Promise<void>;
    private fetchDBSyncData;
    setLastUpdated(collectionName: string, lastUpdated: number): Promise<void>;
    setOldestDeleted(collectionName: string, oldestDeleted: number): Promise<void>;
}
export declare const DBDef_DeletedItems: DBDef<DeletedDBItem>;
export declare const ModuleBE_v2_SyncManager: ModuleBE_v2_SyncManager_Class;
export {};
