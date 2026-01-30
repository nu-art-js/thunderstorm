/*
 * @nu-art/http-server - Express HTTP server and typed ServerApi
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {
	ApiDef,
	BodyApi,
	HttpMethod_Body,
	HttpMethod_Query,
	QueryApi
} from '@nu-art/api-types';
import type {ServerApi_Middleware} from './types.js';
import {_ServerBodyApi, _ServerQueryApi} from './server-api.js';

export function createQueryServerApi<API extends QueryApi<any, any, any, any, HttpMethod_Query>>(
	apiDef: ApiDef<API>,
	action: (params: API['P']) => Promise<API['R']>,
	...middleware: ServerApi_Middleware[]
): _ServerQueryApi<API> {
	return new _ServerQueryApi<API>(apiDef, action).setMiddlewares(...middleware);
}

export function createBodyServerApi<API extends BodyApi<any, any, any, any, HttpMethod_Body>>(
	apiDef: ApiDef<API>,
	action: (body: API['B']) => Promise<API['R']>,
	...middleware: ServerApi_Middleware[]
): _ServerBodyApi<API> {
	return new _ServerBodyApi<API>(apiDef, action).setMiddlewares(...middleware);
}
