/*
 * @nu-art/storm-shared - Shared types for storm packages
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {GeneralApi, ApiStruct} from '@nu-art/api-types';

/** Recursive type mapping an API struct to caller functions at each leaf. */
export type ApiDefCaller<API_Struct extends ApiStruct> = API_Struct extends GeneralApi
	? (...args: unknown[]) => unknown
	: { [P in keyof API_Struct]: ApiDefCaller<API_Struct[P]> };
