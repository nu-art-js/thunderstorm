/*
 * @nu-art/http-server - Express HTTP server and typed ServerApi
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {
	MemKey_HttpRequestBody,
	MemKey_HttpRequestHeaders,
	MemKey_HttpRequestQuery,
	MemKey_HttpRequestUrl
} from './consts.js';
import {__stringify, _keys, ApiException, isErrorOfType, StringMap} from '@nu-art/ts-common';
import type {HttpErrorHandler} from './types.js';

export type AppPropsResolver = () => Promise<StringMap>;

const defaultPropsResolver: AppPropsResolver = async () => ({} as StringMap);

export function DefaultApiErrorMessageComposer(
	headersToAttach: string[] = [],
	propsResolver: AppPropsResolver = defaultPropsResolver
): HttpErrorHandler {
	return async (error: ApiException) => {
		const headers = MemKey_HttpRequestHeaders.get();
		const query = MemKey_HttpRequestQuery.get();
		const url = MemKey_HttpRequestUrl.get();
		const body = MemKey_HttpRequestBody.get();
		const props = await propsResolver();
		let message = `${error?.responseCode ?? '000'} - ${url}\n\n`;
		_keys(props).forEach(key => { message += `  ${key}: ${props[key]}\n`; });
		if (error?.cause?.stack)
			message += `${error.cause.stack}\n`;
		if (headers && headersToAttach.length)
			message += `Headers: ${__stringify(_keys(headers).reduce((acc, k) => (headersToAttach.includes(String(k)) ? { ...acc, [k]: headers[k] } : acc), {} as Record<string, unknown>))}\n`;
		if (query && Object.keys(query).length)
			message += `Query: ${__stringify(query)}\n`;
		if (body && typeof body === 'object' && Object.keys(body).length)
			message += `Body: ${__stringify(body)}\n`;
		const errBody = isErrorOfType(error?.cause ?? error, ApiException)?.responseBody;
		if (errBody?.error)
			message += `Error: ${__stringify(errBody.error)}\n`;
		return message;
	};
}
