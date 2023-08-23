import { DB_EntityDependency, FirestoreQuery } from '@nu-art/firebase';
import { DBDef_V3, DBProto, Module } from '@nu-art/ts-common';
import { Response_DBSync } from '../shared';
import { FirestoreCollectionV3, PostWriteProcessingData } from '@nu-art/firebase/backend/firestore-v3/FirestoreCollectionV3';
import { firestore } from 'firebase-admin';
import { OnFirestoreBackupSchedulerActV2 } from '@nu-art/thunderstorm/backend/modules/backup/ModuleBE_v2_BackupScheduler';
import { FirestoreBackupDetailsV2 } from '@nu-art/thunderstorm/backend/modules/backup/ModuleBE_v2_Backup';
import { DBApiBEConfigV3 } from './v3-db-def';
import Transaction = firestore.Transaction;
export type BaseDBApiConfigV3 = {
    projectId?: string;
    maxChunkSize: number;
};
export type DBApiConfigV3<Proto extends DBProto<any>> = BaseDBApiConfigV3 & DBApiBEConfigV3<Proto>;
/**
 * An abstract base class used for implementing CRUD operations on a specific collection.
 *
 * By default, it exposes API endpoints for creating, deleting, updating, querying and querying for unique document.
 */
export declare abstract class ModuleBE_BaseDBV3<Proto extends DBProto<any>, ConfigType extends DBApiConfigV3<Proto> = DBApiConfigV3<Proto>> extends Module<ConfigType> implements OnFirestoreBackupSchedulerActV2 {
    private readonly ModuleBE_BaseDBV2;
    collection: FirestoreCollectionV3<Proto>;
    dbDef: DBDef_V3<Proto>;
    query: FirestoreCollectionV3<Proto>['query'];
    create: FirestoreCollectionV3<Proto>['create'];
    set: FirestoreCollectionV3<Proto>['set'];
    delete: FirestoreCollectionV3<Proto>['delete'];
    doc: FirestoreCollectionV3<Proto>['doc'];
    runTransaction: FirestoreCollectionV3<Proto>['runTransaction'];
    protected constructor(dbDef: DBDef_V3<Proto>, appConfig?: BaseDBApiConfigV3);
    /**
     * Executed during the initialization of the module.
     * The collection reference is set in this method.
     */
    init(): void;
    getCollectionName(): string;
    getItemName(): string;
    __onFirestoreBackupSchedulerActV2(): FirestoreBackupDetailsV2<Proto['dbType']>[];
    protected resolveBackupQuery(): FirestoreQuery<Proto['dbType']>;
    querySync: (syncQuery: FirestoreQuery<Proto['dbType']>) => Promise<Response_DBSync<Proto['dbType']>>;
    private _preWriteProcessing;
    /**
     * Override this method to customize the processing that should be done before create, set or update.
     *
     * @param transaction - The transaction object.
     * @param dbInstance - The DB entry for which the uniqueness is being asserted.
     */
    protected preWriteProcessing(dbInstance: Proto['uiType'], transaction?: Transaction): Promise<void>;
    private _postWriteProcessing;
    /**
     * Override this method to customize processing that should be done after create, set, update or delete.
     * @param data
     */
    protected postWriteProcessing(data: PostWriteProcessingData<Proto['dbType']>): Promise<void>;
    manipulateQuery(query: FirestoreQuery<Proto['dbType']>): FirestoreQuery<Proto['dbType']>;
    preUpsertProcessing: never;
    protected upgradeItem(dbItem: Proto['uiType'], toVersion: string): Promise<void>;
    promoteCollection(): Promise<void>;
    /**
     * Override this method to provide actions or assertions to be executed before the deletion happens.
     * @param transaction - The transaction object
     * @param dbItems - The DB entry that is going to be deleted.
     */
    canDeleteItems(dbItems: Proto['dbType'][], transaction?: Transaction): Promise<void>;
    collectDependencies(dbInstances: Proto['dbType'][], transaction?: Transaction): Promise<DB_EntityDependency<string>[] | undefined>;
    upgradeCollection(forceUpgrade: boolean): Promise<void>;
    upgradeInstances: (dbInstances: Proto['uiType'][]) => Promise<void>;
}
