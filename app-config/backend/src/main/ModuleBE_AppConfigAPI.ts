/*
 * @nu-art/app-config-backend - App config API module (CRUD + getConfigByKey)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiDef_AppConfig, ApiDef_CRUD_AppConfig, DatabaseDef_AppConfig, type API_AppConfig} from '@nu-art/app-config-shared';
import {ModuleBE_BaseApi_Class} from '@nu-art/db-api-backend';
import {ApiHandler} from '@nu-art/http-server';
import {ModuleBE_AppConfigDB} from './ModuleBE_AppConfigDB.js';

class ModuleBE_AppConfigAPI_Class
	extends ModuleBE_BaseApi_Class<DatabaseDef_AppConfig> {

	constructor() {
		super({
			dbModule: ModuleBE_AppConfigDB,
			crudApiDef: ApiDef_CRUD_AppConfig,
		});
	}

	@ApiHandler(ApiDef_AppConfig.getConfigByKey)
	async getConfigByKey(request: API_AppConfig['getConfigByKey']['Params']): Promise<API_AppConfig['getConfigByKey']['Response']> {
		return ModuleBE_AppConfigDB.getResolverDataByKey(request.key);
	}
}

export const ModuleBE_AppConfigAPI = new ModuleBE_AppConfigAPI_Class();
