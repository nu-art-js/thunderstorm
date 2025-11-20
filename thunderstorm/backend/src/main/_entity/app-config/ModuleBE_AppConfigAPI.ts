import {createQueryServerApi} from '../../core/typed-api.js';
import {addRoutes} from '../../modules/ModuleBE_APIs.js';
import {ModuleBE_BaseApi_Class} from '../../modules/db-api-gen/ModuleBE_BaseApi.js';
import {ApiDef_AppConfig, RequestBody_GetResolverByKey} from '@nu-art/thunderstorm-shared/_entity/app-config/api-def';
import {DBProto_AppConfig} from '@nu-art/thunderstorm-shared';
import {ModuleBE_AppConfigDB} from './ModuleBE_AppConfigDB.js';

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