/*
 * @nu-art/http-request-shared — stored request checks
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {tsValidateGeneralUrl, tsValidateResult, type StringMap} from '@nu-art/ts-common';
import {httpRequestMethodAllowsBody, OutboundHttpMethods, type HttpRequestDef} from './types.js';
import {listSecretNames} from './substitute.js';

const isRecord = (value: unknown): value is Record<string, unknown> =>
	!!value && typeof value === 'object' && !Array.isArray(value);

const isStringMap = (value: unknown): value is StringMap =>
	isRecord(value) && Object.values(value).every(item => typeof item === 'string');

/** Stored URL may still contain `{{key}}` or `{{secret:name}}`. */
export const isHttpsTemplateUrl = (url: string): boolean => {
	if (!url.startsWith('https://'))
		return false;
	const concrete = url.replace(/\{\{(?:secret:)?[A-Za-z0-9._-]+\}\}/g, 'slot');
	try {
		const parsed = new URL(concrete);
		return parsed.protocol === 'https:' && !parsed.username && !parsed.password;
	} catch {
		return false;
	}
};

export const validateHttpRequestDef = (value: unknown): string | undefined => {
	if (!isRecord(value))
		return 'must be an HTTP request';
	if (!OutboundHttpMethods.includes(value.method as typeof OutboundHttpMethods[number]))
		return 'method is invalid';
	if (typeof value.url !== 'string' || !isHttpsTemplateUrl(value.url))
		return 'url must be https';
	if (value.headers !== undefined && !isStringMap(value.headers))
		return 'headers must be a string map';
	if (value.body !== undefined && typeof value.body !== 'string')
		return 'body must be a string';
	if (value.timeout !== undefined && (typeof value.timeout !== 'number' || value.timeout <= 0))
		return 'timeout must be a positive number';
	if (!httpRequestMethodAllowsBody(String(value.method)) && value.body)
		return 'method cannot carry a body';
	return undefined;
};

/** Rendered URL, once every secret slot in it is gone. */
export const validateRenderedUrl = (url: string): string | undefined => {
	if (listSecretNames(url).length)
		return undefined;
	const invalid = tsValidateResult(url, tsValidateGeneralUrl(), undefined, false);
	return invalid ? 'url must be https' : undefined;
};

export const asHttpRequestDef = (value: unknown): HttpRequestDef => {
	const invalid = validateHttpRequestDef(value);
	if (invalid)
		throw new Error(invalid);
	return value as HttpRequestDef;
};
