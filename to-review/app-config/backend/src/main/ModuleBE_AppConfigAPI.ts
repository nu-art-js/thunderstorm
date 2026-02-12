/*
 * @nu-art/app-config-backend - App config API module (CRUD + getConfigByKey)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiDef_AppConfig, CrudApiDef_AppConfig, type RequestBody_GetResolverByKey, type Types_AppConfig} from '@nu-art/app-config-shared';
import {ModuleBE_BaseApi_Class} from '@nu-art/db-api-backend';
import {ApiHandler} from '@nu-art/http-server';
import {ModuleBE_AppConfigDB} from './ModuleBE_AppConfigDB.js';

class ModuleBE_AppConfigAPI_Class
	extends ModuleBE_BaseApi_Class<Types_AppConfig> {

	constructor() {
		super({
			dbModule: ModuleBE_AppConfigDB,
			crudApiDef: CrudApiDef_AppConfig,
		});
	}

	@ApiHandler(ApiDef_AppConfig._v1.getConfigByKey)
	async getConfigByKey(request: RequestBody_GetResolverByKey): Promise<unknown> {
		return ModuleBE_AppConfigDB.getResolverDataByKey(request.key);
	}
}

export const ModuleBE_AppConfigAPI = new ModuleBE_AppConfigAPI_Class();
