import { createQueryServerApi } from "@nu-art/thunder-db-api-backend";
import { addRoutes } from "@nu-art/thunder-db-api-backend";
import { ModuleBE_BaseApi_Class } from "@nu-art/thunder-db-api-backend";
import { ApiDef_AppConfig, RequestBody_GetResolverByKey, DBProto_AppConfig } from '@nu-art/thunderstorm-app-config-shared';
import { ModuleBE_AppConfigDB } from './ModuleBE_AppConfigDB.js';
class ModuleBE_AppConfigAPI_Class extends ModuleBE_BaseApi_Class<DBProto_AppConfig> {
    constructor() {
        super(ModuleBE_AppConfigDB);
    }
    init() {
        super.init();
        addRoutes([
            createQueryServerApi(ApiDef_AppConfig._v1.getConfigByKey, this.getConfigByKey)
        ]);
    }
    private getConfigByKey = async (request: RequestBody_GetResolverByKey) => {
        return ModuleBE_AppConfigDB.getResolverDataByKey(request.key);
    };
}
export const ModuleBE_AppConfigAPI = new ModuleBE_AppConfigAPI_Class();
