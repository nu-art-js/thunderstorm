import {createQueryServerApi} from '../../../backend/core/typed-api';
import {addRoutes} from '../../../backend/modules/ModuleBE_APIs';
import {ModuleBE_BaseApi_Class} from '../../../backend/modules/db-api-gen/ModuleBE_BaseApi';
import {ApiDef_AppConfig, RequestBody_GetResolverByKey} from '../shared/api-def';
import {DBProto_AppConfig} from '../shared/types';
import {ModuleBE_AppConfigDB} from './ModuleBE_AppConfigDB';

class ModuleBE_AppConfigAPI_Class
	extends ModuleBE_BaseApi_Class<DBProto_AppConfig> {

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