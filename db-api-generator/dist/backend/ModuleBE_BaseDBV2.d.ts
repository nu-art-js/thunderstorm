import { DB_EntityDependency, FirestoreQuery } from '@nu-art/firebase';
import { DB_Object, DBDef, Default_UniqueKey, Module, PreDB } from '@nu-art/ts-common';
import { DBApiBEConfig } from './db-def';
import { Response_DBSync } from '../shared';
import { FirestoreCollectionV2, PostWriteProcessingData } from '@nu-art/firebase/backend/firestore-v2/FirestoreCollectionV2';
import { firestore } from 'firebase-admin';
import { OnFirestoreBackupSchedulerActV2 } from '@nu-art/thunderstorm/backend/modules/backup/ModuleBE_v2_BackupScheduler';
import { FirestoreBackupDetailsV2 } from '@nu-art/thunderstorm/backend/modules/backup/ModuleBE_v2_Backup';
import Transaction = firestore.Transaction;
export type BaseDBApiConfig = {
    projectId?: string;
    maxChunkSize: number;
};
export type DBApiConfig<Type extends DB_Object> = BaseDBApiConfig & DBApiBEConfig<Type>;
/**
 * An abstract base class used for implementing CRUD operations on a specific collection.
 *
 * By default, it exposes API endpoints for creating, deleting, updating, querying and querying for unique document.
 */
export declare abstract class ModuleBE_BaseDBV2<Type extends DB_Object, ConfigType extends {} = {}, Ks extends keyof PreDB<Type> = Default_UniqueKey> extends Module<ConfigType & DBApiConfig<Type>> implements OnFirestoreBackupSchedulerActV2 {
    private readonly ModuleBE_BaseDBV2;
    collection: FirestoreCollectionV2<Type>;
    dbDef: DBDef<Type, any>;
    query: FirestoreCollectionV2<Type>['query'];
    create: FirestoreCollectionV2<Type>['create'];
    set: FirestoreCollectionV2<Type>['set'];
    delete: FirestoreCollectionV2<Type>['delete'];
    doc: FirestoreCollectionV2<Type>['doc'];
    runTransaction: FirestoreCollectionV2<Type>['runTransaction'];
    protected constructor(dbDef: DBDef<Type, any>, appConfig?: BaseDBApiConfig);
    /**
     * Executed during the initialization of the module.
     * The collection reference is set in this method.
     */
    init(): void;
    getCollectionName(): string;
    getItemName(): string;
    __onFirestoreBackupSchedulerActV2(): FirestoreBackupDetailsV2<Type>[];
    protected resolveBackupQuery(): FirestoreQuery<Type>;
    querySync: (syncQuery: FirestoreQuery<Type>) => Promise<Response_DBSync<Type>>;
    private _preWriteProcessing;
    /**
     * Override this method to customize the processing that should be done before create, set or update.
     *
     * @param transaction - The transaction object.
     * @param dbInstance - The DB entry for which the uniqueness is being asserted.
     * @param request
     */
    protected preWriteProcessing(dbInstance: PreDB<Type>, transaction?: Transaction): Promise<void>;
    private _postWriteProcessing;
    /**
     * Override this method to customize processing that should be done after create, set, update or delete.
     * @param data: a map of updated and deleted dbItems - deleted === null means the whole collection has been deleted
     */
    protected postWriteProcessing(data: PostWriteProcessingData<Type>): Promise<void>;
    manipulateQuery(query: FirestoreQuery<Type>): FirestoreQuery<Type>;
    preUpsertProcessing: never;
    protected upgradeItem(dbItem: PreDB<Type>, toVersion: string): Promise<void>;
    promoteCollection(): Promise<void>;
    /**
     * Override this method to provide actions or assertions to be executed before the deletion happens.
     * @param transaction - The transaction object
     * @param dbItems - The DB entry that is going to be deleted.
     */
    canDeleteItems(dbItems: Type[], transaction?: Transaction): Promise<void>;
    collectDependencies(dbInstances: Type[], transaction?: Transaction): Promise<DB_EntityDependency<string>[] | undefined>;
    upgradeCollection(forceUpgrade: boolean): Promise<void>;
    upgradeInstances: (dbInstances: PreDB<Type>[]) => Promise<void>;
}
