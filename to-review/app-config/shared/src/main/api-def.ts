/*
 * @nu-art/app-config-shared - App config custom API (getConfigByKey)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {ApiDefResolver, QueryApi} from '@nu-art/http-client';
import {HttpMethod} from '@nu-art/http-client';
import {DatabaseDef_AppConfig} from './types.js';
import {CrudApiDef} from '@nu-art/db-api-shared';
import {DBDef_AppConfig} from './db-def.js';

export type RequestBody_GetResolverByKey = { key: string };

export type ApiStruct_AppConfig = {
	getConfigByKey: QueryApi<unknown, RequestBody_GetResolverByKey>;
};

export const ApiDef_AppConfig: ApiDefResolver<ApiStruct_AppConfig> = {
	getConfigByKey: {method: HttpMethod.GET, path: 'v1/app-config/get-resolver-data-by-key'},
};


export const ApiDef_CRUD_AppConfig = CrudApiDef<DatabaseDef_AppConfig>(DBDef_AppConfig.dbKey);