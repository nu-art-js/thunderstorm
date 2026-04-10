/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {RouteParams, StringMap} from '@nu-art/ts-common';

export {composeQueryParams, composeUrl} from '@nu-art/ts-common';

/**
 * Substitutes `:paramName` tokens in a URL path with values from the params object.
 * Consumed keys are removed from the returned remainingParams so they don't also
 * appear as query parameters.
 *
 * Tokens must match `:[a-zA-Z_][a-zA-Z0-9_]*` — standard route-param syntax.
 * Unmatched tokens (no corresponding key in params) are left as-is.
 */
export function interpolatePathParams<P extends RouteParams>(url: string, params: P): { url: string; remainingParams: P } {
	const remainingParams = {...params};

	const interpolated = url.replace(/:([a-zA-Z_]\w*)/g, (_match, key: string) => {
		if (!(key in remainingParams) || remainingParams[key] === undefined || remainingParams[key] === null)
			return _match;

		const value = remainingParams[key];
		delete remainingParams[key];
		const resolved = typeof value === 'function' ? value() : value;
		return encodeURIComponent(String(resolved));
	});

	return {url: interpolated, remainingParams};
}

/**
 * Encodes URL parameters into a StringMap with URI-encoded values.
 *
 * Similar to composeQueryParams but returns an object instead of a query string.
 * Useful when you need the encoded parameters as a map rather than a string.
 *
 * @param params - Route parameters object
 * @returns Object with URI-encoded parameter values
 */
export function encodeUrlParams(params: RouteParams = {}): StringMap {
	const result: StringMap = {};
	for (const key of Object.keys(params)) {
		let value = params[key];
		if (value === undefined || value === null)
			continue;

		if (typeof value === 'function')
			value = value();

		result[key] = encodeURIComponent(value);
	}
	return result;
}
