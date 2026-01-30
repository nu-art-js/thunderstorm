import { FirestoreQuery } from '@nu-art/firebase-shared';
import { DBDef_V3, DBProto, Module } from '@nu-art/ts-common';
import { CollectionActionType, FirestoreCollectionV3, PostWriteProcessingData } from '@nu-art/firebase-backend/firestore-v3/FirestoreCollectionV3';
import { Transaction } from 'firebase-admin/firestore';
export type BaseDBApiConfigV3 = {
    projectId?: string;
    chunksSize: number;
};
export type DBApiConfigV3<Proto extends DBProto<any>> = BaseDBApiConfigV3 & DBApiBEConfig<Proto>;
/**
 * An abstract base class used for implementing CRUD operations on a specific collection.
 *
 * By default, it exposes API endpoints for creating, deleting, updating, querying and querying for unique document.
 */
export declare abstract class ModuleBE_BaseDB<Proto extends DBProto<any>, ConfigType = any, Config extends ConfigType & DBApiConfigV3<Proto> = ConfigType & DBApiConfigV3<Proto>> extends Module<Config> implements EntityDependencyCollection {
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
    __collectEntityDependencies: <T extends DBProto<any>>(type: T["dbKey"], itemIds: string[], transaction?: Transaction) => Promise<DBEntityDependencies | undefined>;
    private mapConflicts;
    /**
     * Executed during the initialization of the module.
     * The collection reference is set in this method.
     */
    init(): void;
    querySync: (syncQuery: FirestoreQuery<Proto["dbType"]>) => Promise<Response_DBSync<Proto["dbType"]>>;
    private _preWriteProcessing;
    /**
     * Override this method to customize the processing that should be done before create, set or update.
     *
     * @param transaction - The transaction object.
     * @param dbInstance - The DB entry for which the uniqueness is being asserted.
     * @param originalDbInstance - The DB instance fetched from remote firestore.
     */
    protected preWriteProcessing(dbInstance: Proto['uiType'], originalDbInstance: Proto['dbType'], transaction?: Transaction): Promise<void>;
    private _postWriteProcessing;
    /**
     * Override this method to customize processing that should be done after create, set, update or delete.
     * @param data
     * @param actionType create/set/update/delete
     * @param transaction
     */
    protected postWriteProcessing(data: PostWriteProcessingData<Proto>, actionType: CollectionActionType, transaction?: Transaction): Promise<void>;
    manipulateQuery(query: FirestoreQuery<Proto['dbType']>): FirestoreQuery<Proto['dbType']>;
    preUpsertProcessing: never;
    /**
     * Override this method to provide actions or assertions to be executed before the deletion happens.
     * @param transaction - The transaction object
     * @param dbItems - The DB entry that is going to be deleted.
     */
    canDeleteItems(dbItems: Proto['dbType'][], transaction?: Transaction): Promise<void>;
    collectDependencies(dbInstances: Proto['dbType'][], transaction?: Transaction): Promise<DBEntityDependencies | undefined>;
    private versionUpgrades;
    /**
     * Upgrades the entity from the given version to the next one (to the same version if the given version is the latest)
     * @param version - The version we start from
     * @param processor
     */
    registerVersionUpgradeProcessor<K extends Proto['versions']['versions'][number]>(version: K, processor: (items: Proto['versions']['types'][K][]) => Promise<void>): void;
    /**
     * Check if the collection has at least one item without the latest version. Version[0] is the latest version.
     */
    isCollectionUpToDate: () => Promise<boolean>;
    upgradeCollection: (force?: boolean) => Promise<void>;
    processCollection: (processInstances: (instances: Proto["dbType"][]) => Promise<void>) => Promise<void>;
    upgradeInstances(instances: Proto['dbType'][], force?: boolean): Promise<Proto["dbType"][]>;
}
