/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {ApiDef, GeneralApi} from '../types/api-types.js';


/**
 * Raw HTTP response structure.
 * Compatible with Axios response structure.
 */
export type RawHttpResponse<R> = {
	data: R;
	status: number;
	statusText: string;
	headers: Record<string, string | string[] | undefined>;
	config: unknown;
};

/**
 * Full context object passed to callbacks after API execution.
 */
export type ApiCallContext<API extends GeneralApi> = {
	response: API['R'];
	statusCode: number;
	headers: Record<string, string | string[] | undefined>;
	body?: API['B'];
	params?: API['P'];
	apiDef: ApiDef<API>;
	duration: number;
	rawResponse: RawHttpResponse<API['R']>;
};

/**
 * User-provided callback after API response.
 */
export type ApiCallback<API extends GeneralApi> =
	(ctx: ApiCallContext<API>) => void | Promise<void>;
