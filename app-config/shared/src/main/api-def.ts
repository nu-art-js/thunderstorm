/*
 * @nu-art/app-config-shared - App config custom API (getConfigByKey)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {ApiDefResolver, QueryApi} from '@nu-art/http-client';
import {HttpMethod} from '@nu-art/http-client';

export type RequestBody_GetResolverByKey = { key: string };

export type ApiStruct_AppConfig = {
	_v1: {
		getConfigByKey: QueryApi<unknown, RequestBody_GetResolverByKey>;
	};
};

export const ApiDef_AppConfig: ApiDefResolver<ApiStruct_AppConfig> = {
	_v1: {
		getConfigByKey: {method: HttpMethod.GET, path: 'v1/app-config/get-resolver-data-by-key'},
	},
};
