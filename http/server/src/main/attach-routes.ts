/*
 * @nu-art/http-server - Express HTTP server and typed ServerApi
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {Express, ExpressRouter} from './types.js';
import type {ServerApi} from './server-api.js';

export function attachRoutes(expressApp: Express, pathPrefix: string, routes: ServerApi<any>[], baseUrl: string): void {
	for (const api of routes) {
		if (typeof (api as ServerApi<any>).route !== 'function')
			throw new Error('API must have route(router, prefixUrl, baseUrl)');
		(api as ServerApi<any>).route(expressApp as unknown as ExpressRouter, pathPrefix, baseUrl);
	}
}
