/*
 * @nu-art/sync-manager-backend — Route whose HTTP body is the request write set
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiHandler, type ApiHandlerOptions} from '@nu-art/http-server';
import type {ResolvableContent} from '@nu-art/ts-common';
import type {GeneralApi, SyncApiDef} from '@nu-art/sync-manager-shared';
import {readWrittenSync} from './written-sync.js';

type HandlerOptions<Module> = Omit<ApiHandlerOptions<Module>, 'composeResponse'>;

export function SyncApiHandler<API extends GeneralApi, Module = unknown>(
	apiDef: ResolvableContent<SyncApiDef<API>, [Module]>,
	options?: HandlerOptions<Module>,
) {
	return function (
		originalMethod: (this: Module, payload: API['B'] | API['P']) => Promise<void>,
		context: ClassMethodDecoratorContext<Module>,
	) {
		ApiHandler<API, Module>(apiDef, {
			...options,
			composeResponse: () => readWrittenSync(),
		})(
			originalMethod as (this: Module, payload: API['B'] | API['P']) => Promise<API['R']>,
			context as ClassMethodDecoratorContext<Module, (this: Module, payload: API['B'] | API['P']) => Promise<API['R']>>,
		);
		return originalMethod;
	};
}
