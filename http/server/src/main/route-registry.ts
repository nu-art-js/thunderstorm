/*
 * @nu-art/http-server - Express HTTP server and typed ServerApi
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {MUSTNeverHappenException} from '@nu-art/ts-common';
import type {ServerApi} from './server-api.js';

const routes: ServerApi<any>[] = [];

export function addRoutes(apis: ServerApi<any>[]): void {
	for (const api of apis) {
		if (routes.some(r => r.apiDef.path === api.apiDef.path))
			throw new MUSTNeverHappenException(`Duplicate API path: ${api.apiDef.path}`);
		routes.push(api);
	}
}

export function getRoutes(): ServerApi<any>[] {
	return routes;
}
