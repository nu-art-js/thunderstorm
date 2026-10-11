import {UrlQueryParams} from '@nu-art/api-types';

export type LocationUrl = { pathname: string; search?: string; hash?: string };

/** Decoded query from an absolute URL. An empty value is `undefined`. */
export function readQueryParams(href: string): UrlQueryParams {
	const params: UrlQueryParams = {};
	new URL(href).searchParams.forEach((value, key) => {
		params[key] = value.length === 0 ? undefined : value;
	});
	return params;
}

/**
 * Decoded value, `null` when the key is present with an empty value, `undefined` when the key is absent.
 */
export function readQueryParameter(href: string, key: string): string | null | undefined {
	const queryParams = readQueryParams(href);
	const value = queryParams[key];
	if (value === undefined && Object.keys(queryParams).includes(key))
		return null;

	return value;
}

function locationString(url: URL): string {
	return `${url.pathname}${url.search}${url.hash}`;
}

/** Replace the query. Empty and missing values are omitted. Other parts of the URL stay. */
export function setQueryOnUrl(href: string, queryParams: UrlQueryParams): string {
	const url = new URL(href);
	url.search = '';
	Object.keys(queryParams).forEach(key => {
		const value = queryParams[key];
		if (!value)
			return;

		url.searchParams.set(key, value);
	});
	return locationString(url);
}

/** Set one query value. Existing values are decoded and encoded once. */
export function addQueryParamOnUrl(href: string, key: string, value: string): string {
	const url = new URL(href);
	url.searchParams.set(key, value);
	return locationString(url);
}

/** Delete one query key. Remaining values are decoded and encoded once. */
export function removeQueryParamOnUrl(href: string, key: string): string {
	const url = new URL(href);
	url.searchParams.delete(key);
	return locationString(url);
}

/** Build a path from a location descriptor. Search is parsed and encoded once. */
export function toLocationUrl(origin: string, location: LocationUrl): string {
	const url = new URL(location.pathname, origin);
	url.search = location.search ?? '';
	url.hash = location.hash ?? '';
	return locationString(url);
}
