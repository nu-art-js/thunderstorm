/*
 * @nu-art/http-server - Express HTTP server and typed ServerApi
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {ResolvableContent} from '@nu-art/ts-common';
import type {ValidatorTypeResolver} from '@nu-art/ts-common';
import type {ApiDef, GeneralApi} from '@nu-art/api-types';
import type {ServerApi} from './server-api.js';
import type {ServerApi_Middleware} from './types.js';

/** Server instance that can receive route registration. Implemented by HttpServer. */
export type ServerRouteRegistry = {
	addRoute(api: ServerApi<any>): void;
};

/** Configuration options for ApiHandler decorator. Mirror of client ApiCallerOptions. */
export type ApiHandlerOptions<Module, API extends GeneralApi> = {
	server?: ResolvableContent<ServerRouteRegistry, [Module]>;
	middlewares?: ServerApi_Middleware[];
	bodyValidator?: ValidatorTypeResolver<API['B']>;
	queryValidator?: ValidatorTypeResolver<API['P']>;
};

export type ApiHandlerMetadataEntry<Module = unknown> = {
	apiDefResolver: ResolvableContent<ApiDef<any>, [Module]>;
	methodKey: string;
	options: ApiHandlerOptions<Module, any>;
};
