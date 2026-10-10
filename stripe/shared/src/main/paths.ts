import {BadImplementationException} from '@nu-art/ts-common';

/**
 * Joins an app-relative path to the app base URL. Absolute or protocol-relative paths are refused,
 * so a client cannot turn checkout/portal into an open redirect.
 */
export const appUrl = (baseUrl: string, path: string): string => {
	if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\'))
		throw new BadImplementationException(`Expected an app-relative path, got '${path}'`);

	const url = new URL(path, baseUrl);
	if (url.origin !== new URL(baseUrl).origin)
		throw new BadImplementationException(`Path '${path}' leaves the app origin`);

	return url.toString();
};
