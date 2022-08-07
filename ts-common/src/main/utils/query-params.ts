export type RouteParams = { [key: string]: string | number | boolean | undefined | (() => string | number) }

export function composeQueryParams(params: RouteParams = {}) {
	return Object.keys(params).map((paramKey) => {
		let param = params[paramKey];
		if (param === undefined || param === null)
			return `${paramKey}=`;

		if (typeof param === 'function')
			param = param();

		return `${paramKey}=${encodeURIComponent(param)}`;
	}).join('&');
}

export function composeUrl(url: string, params: RouteParams = {}) {
	const queryAsEncodedString = composeQueryParams(params);

	if (queryAsEncodedString.length)
		return `${url}?${queryAsEncodedString}`;

	return url;
}
