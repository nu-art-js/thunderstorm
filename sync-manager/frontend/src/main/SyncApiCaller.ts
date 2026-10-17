/*
 * @nu-art/sync-manager-frontend — Caller that applies the response write set to IndexedDB
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiCaller, type ApiCallerOptions} from '@nu-art/http-client';
import type {GeneralApi} from '@nu-art/api-types';
import type {ResolvableContent} from '@nu-art/ts-common';
import type {SyncApiDef, SyncDelta} from '@nu-art/sync-manager-shared';
import {ModuleFE_SyncManager} from './modules/ModuleFE_SyncManager.js';

export function SyncApiCaller<API extends GeneralApi, Module = any>(
	apiDef: ResolvableContent<SyncApiDef<API>, [Module]>,
	options?: ApiCallerOptions<Module, API>,
) {
	return ApiCaller(apiDef, {
		...options,
		onComplete: async (module, ctx) => {
			await ModuleFE_SyncManager.applyWrittenDelta(ctx.response as SyncDelta);
			await options?.onComplete?.(module, ctx);
		},
	});
}
