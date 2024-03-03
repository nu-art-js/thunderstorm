import {addRoutes, createQueryServerApi, ModuleBE_BaseApiV3_Class} from '../../../backend';
import {ApiDef_AppConfig, DBProto_AppConfig, RequestBody_GetResolverByKey} from '../shared';
import {ModuleBE_AppConfigDB} from './ModuleBE_AppConfigDB';

class ModuleBE_AppConfigAPI_Class
	extends ModuleBE_BaseApiV3_Class<DBProto_AppConfig> {
	
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