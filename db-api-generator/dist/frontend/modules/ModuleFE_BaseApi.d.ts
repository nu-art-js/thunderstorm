import { ApiDefCaller } from '@nu-art/thunderstorm';
import { ApiStruct_DBApiGenIDB, DBSyncData } from '../shared';
import { ThunderDispatcher } from '@nu-art/thunderstorm/frontend';
import { DB_Object, DBDef, Default_UniqueKey, PreDB } from '@nu-art/ts-common';
import { DBApiFEConfig } from '../db-def';
import { SyncIfNeeded } from './ModuleFE_SyncManager';
import { ApiCallerEventType } from './types';
import { ModuleFE_BaseDB } from './ModuleFE_BaseDB';
export declare abstract class ModuleFE_BaseApi<DBType extends DB_Object, Ks extends keyof PreDB<DBType> = Default_UniqueKey, Config extends DBApiFEConfig<DBType, Ks> = DBApiFEConfig<DBType, Ks>> extends ModuleFE_BaseDB<DBType, Ks, Config> implements ApiDefCaller<ApiStruct_DBApiGenIDB<DBType, Ks>>, SyncIfNeeded {
    readonly v1: ApiDefCaller<ApiStruct_DBApiGenIDB<DBType, Ks>>['v1'];
    private operations;
    protected constructor(dbDef: DBDef<DBType, Ks>, defaultDispatcher: ThunderDispatcher<any, string, ApiCallerEventType<DBType>>);
    protected cleanUp: (toUpsert: PreDB<DBType>) => PreDB<DBType>;
    private updatePending;
    __syncIfNeeded: (syncData: DBSyncData[]) => Promise<void>;
}
