import { ApiDefCaller } from '@nu-art/thunderstorm';
import { ApiStruct_DBApiGenIDBV3, DBSyncData } from '../shared';
import { ThunderDispatcher } from '@nu-art/thunderstorm/frontend';
import { DBDef_V3, DBProto } from '@nu-art/ts-common';
import { SyncIfNeeded } from './ModuleFE_SyncManager';
import { DBApiFEConfigV3 } from '../v3-db-def';
import { ModuleFE_v3_BaseDB } from './ModuleFE_v3_BaseDB';
import { ApiCallerEventTypeV3 } from './v3_types';
export declare abstract class ModuleFE_v3_BaseApi<Proto extends DBProto<any>, Config extends DBApiFEConfigV3<Proto> = DBApiFEConfigV3<Proto>> extends ModuleFE_v3_BaseDB<Proto, Config> implements ApiDefCaller<ApiStruct_DBApiGenIDBV3<Proto>>, SyncIfNeeded {
    readonly v1: ApiDefCaller<ApiStruct_DBApiGenIDBV3<Proto>>['v1'];
    private operations;
    protected constructor(dbDef: DBDef_V3<Proto>, defaultDispatcher: ThunderDispatcher<any, string, ApiCallerEventTypeV3<Proto>>);
    protected cleanUp: (toUpsert: Proto['uiType']) => Proto["uiType"];
    private updatePending;
    __syncIfNeeded: (syncData: DBSyncData[]) => Promise<void>;
}
