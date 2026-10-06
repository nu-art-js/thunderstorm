/*
 * @nu-art/http-request-backend — render params, log, resolve secrets, send
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {HttpCodes} from '@nu-art/api-types';
import {
	applySecretMap,
	listSecretNames,
	renderHttpRequest,
	type HttpRequestDef,
} from '@nu-art/http-request-shared';
import {Logger, type StringMap} from '@nu-art/ts-common';

const ResponseBodyCap = 8_192;
const DefaultTimeoutMs = 15_000;

export type HttpRequestSend = (request: HttpRequestDef) => Promise<{status: number; body: unknown}>;

export type HttpRequestDispatchDeps = {
	resolveSecret: (name: string) => Promise<string | undefined>;
	send: HttpRequestSend;
	logRequest: (request: HttpRequestDef) => void;
	logFailure: (failure: {status?: number; body?: unknown; message?: string}) => void;
};

const parseRendered = (text: string): HttpRequestDef => {
	try {
		return JSON.parse(text) as HttpRequestDef;
	} catch {
		throw HttpCodes._4XX.BAD_REQUEST('Request template is not valid JSON after substitution');
	}
};

/**
 * 1. Fill `{{key}}` from the caller map.
 * 2. Log that request. Secret slots are still `{{secret:name}}`.
 * 3. Fill only the secret names that were already in the template.
 * 4. Send. The resolved request is not logged.
 * 5. On failure, log the status and response body.
 */
export const dispatchStoredHttpRequest = async (
	request: HttpRequestDef,
	params: StringMap,
	deps: HttpRequestDispatchDeps,
): Promise<{status: number; body: unknown}> => {
	const secretNames = listSecretNames(JSON.stringify(request));
	const rendered = renderHttpRequest(request, params);
	deps.logRequest(rendered);

	const secrets: StringMap = {};
	for (const name of secretNames) {
		const value = await deps.resolveSecret(name);
		if (value === undefined)
			throw HttpCodes._4XX.PRECONDITION_FAILED(`Missing data: secret:${name}`);
		secrets[name] = value;
	}

	const resolved = parseRendered(applySecretMap(JSON.stringify(rendered), secrets));
	try {
		const response = await deps.send(resolved);
		if (response.status < 200 || response.status >= 300)
			deps.logFailure({status: response.status, body: response.body});
		return response;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		deps.logFailure({message});
		throw error;
	}
};

export const sendHttpRequest = async (request: HttpRequestDef): Promise<{status: number; body: unknown}> => {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), request.timeout ?? DefaultTimeoutMs);
	try {
		const response = await fetch(request.url, {
			method: request.method,
			headers: request.headers,
			body: request.body || undefined,
			redirect: 'manual',
			signal: controller.signal,
		});
		const text = await response.text();
		const capped = text.length > ResponseBodyCap ? text.slice(0, ResponseBodyCap) : text;
		let body: unknown = capped;
		if (capped) {
			try {
				body = JSON.parse(capped);
			} catch {
				body = capped;
			}
		}
		return {status: response.status, body};
	} finally {
		clearTimeout(timer);
	}
};

const dispatcherLog = new Logger('http-request');

export const dispatchHttpRequest = (
	request: HttpRequestDef,
	params: StringMap,
	resolveSecret: (name: string) => Promise<string | undefined>,
): Promise<{status: number; body: unknown}> =>
	dispatchStoredHttpRequest(request, params, {
		resolveSecret,
		send: sendHttpRequest,
		logRequest: ready => dispatcherLog.logInfo('Http request', ready),
		logFailure: failure => dispatcherLog.logError('Http request failed', failure),
	});
