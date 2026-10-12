import {HttpCodes} from '@nu-art/api-types';

export const DefaultEmbedOriginLimit = 20;

/** An exact origin: https, or http on localhost for development. No path, query or trailing slash. */
export const assertEmbedOrigin = (value: string): string => {
	const trimmed = value.trim();
	let url: URL;
	try {
		url = new URL(trimmed);
	} catch {
		throw HttpCodes._4XX.BAD_REQUEST('Invalid origin', `'${value}' is not an origin like https://example.com`);
	}

	if (url.origin !== trimmed)
		throw HttpCodes._4XX.BAD_REQUEST('Invalid origin', `'${value}' must be an exact origin (no path, query or trailing slash)`);

	const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
	if (url.protocol === 'https:' || (url.protocol === 'http:' && local))
		return url.origin;

	throw HttpCodes._4XX.BAD_REQUEST('Invalid origin', `'${value}' must use https (http only for localhost)`);
};

/** Validates and de-duplicates a list of origins. */
export const parseEmbedOriginList = (input: unknown, limit = DefaultEmbedOriginLimit): string[] => {
	if (!Array.isArray(input))
		throw HttpCodes._4XX.BAD_REQUEST('Invalid origins', 'origins must be a list');

	if (input.length > limit)
		throw HttpCodes._4XX.BAD_REQUEST('Too many origins', `At most ${limit} origins`);

	const origins: string[] = [];
	for (const item of input) {
		if (typeof item !== 'string')
			throw HttpCodes._4XX.BAD_REQUEST('Invalid origin', 'Each origin must be a string');

		const origin = assertEmbedOrigin(item);
		if (!origins.includes(origin))
			origins.push(origin);
	}

	return origins;
};

/** Origins still allowed: the token's list intersected with the app's current list. */
export const intersectEmbedOrigins = (tokenOrigins: readonly string[], current: readonly string[]): string[] => {
	const allowed = new Set(current);
	return tokenOrigins.filter(origin => allowed.has(origin));
};

/** `'self'` keeps same-origin previews working; third parties match the list only. */
export const frameAncestorsCsp = (origins: readonly string[]): string =>
	origins.length === 0 ? 'frame-ancestors \'none\'' : `frame-ancestors 'self' ${origins.join(' ')}`;

/**
 * Where a framed embed posts its resize message. Never `*`: the referrer when it is allowed (or self),
 * otherwise each allowed origin (the browser delivers only to a parent of that origin).
 */
export const embedPostMessageTargets = (input: { referrer: string; allowedOrigins: readonly string[]; selfOrigin: string }): string[] => {
	let referrerOrigin = '';
	try {
		referrerOrigin = input.referrer ? new URL(input.referrer).origin : '';
	} catch {
		referrerOrigin = '';
	}

	if (referrerOrigin && (referrerOrigin === input.selfOrigin || input.allowedOrigins.includes(referrerOrigin)))
		return [referrerOrigin];

	const targets = [...new Set(input.allowedOrigins)];
	if (input.selfOrigin && !targets.includes(input.selfOrigin))
		targets.push(input.selfOrigin);

	return targets;
};
