import { StringMap } from '@nu-art/ts-common';
import { RouteParams } from '../types/types.js';
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
export declare function composeQueryParams(params?: RouteParams): string;
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
export declare function composeUrl(url: string, params?: RouteParams, hash?: string): string;
/**
 * Encodes URL parameters into a StringMap with URI-encoded values.
 *
 * Similar to composeQueryParams but returns an object instead of a query string.
 * Useful when you need the encoded parameters as a map rather than a string.
 *
 * @param params - Route parameters object
 * @returns Object with URI-encoded parameter values
 */
export declare function encodeUrlParams(params?: RouteParams): StringMap;
