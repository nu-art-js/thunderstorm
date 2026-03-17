/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {StringMap} from '@nu-art/ts-common';
import {RouteParams} from '../types/types.js';


/**
 * Composes a query string from parameters.
 *
 * Converts an object of parameters into a URL-encoded query string.
 * - Functions are evaluated to get their return value
 * - undefined/null values result in `key=` (empty value)
 * - All values are URI-encoded
 *
 * @param params - Object with parameter keys and values
 * @returns URL-encoded query string (e.g., "key1=value1&key2=value2")
 */
export function composeQueryParams(params: RouteParams = {}) {
	return Object.keys(params).map((paramKey) => {
		let paramValue = params[paramKey];
		if (paramValue === undefined || paramValue === null)
			return `${paramKey}=`;

		if (typeof paramValue === 'function')
			paramValue = paramValue();

		return `${paramKey}=${encodeURIComponent(paramValue)}`;
	}).join('&');
}

/**
 * Composes a complete URL with query parameters and optional hash.
 *
 * Combines a base URL with query parameters and/or a hash fragment.
 * Only adds query string if there are parameters. Hash is added if provided.
 *
 * @param url - Base URL
 * @param params - Query parameters object
 * @param hash - Optional hash fragment (will add '#' if not present)
 * @returns Complete URL with query string and/or hash
 *
 * @example
 * ```typescript
 * composeUrl('/path', {foo: 'bar'}, 'section1')
 * // Returns: '/path?foo=bar#section1'
 * ```
 */
export function composeUrl(url: string, params: RouteParams = {}, hash = '') {
	const queryAsEncodedString = composeQueryParams(params);

	if (queryAsEncodedString.length)
		return `${url}?${queryAsEncodedString}`;

	if (hash.length)
		return `${url}${hash.startsWith('#') ? hash : `#${hash}`}`;

	return url;
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
	const encodedQueryParams: StringMap = {};
	Object.keys(params).forEach(paramKey => {
		const paramValue = params[paramKey];
		let finalValue;
		if (paramValue === undefined || paramValue === null)
			finalValue = '';
		else if (typeof paramValue === 'function')
			finalValue = paramValue();
		else
			finalValue = paramValue;

		encodedQueryParams[paramKey] = encodeURIComponent(finalValue);
	});
	return encodedQueryParams;
}
