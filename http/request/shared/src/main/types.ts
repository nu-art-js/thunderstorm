/*
 * @nu-art/http-request-shared — stored outbound HTTP request
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {HttpMethod, HttpMethod_Body} from '@nu-art/api-types';
import type {StringMap} from '@nu-art/ts-common';

/** Methods a stored request may send. `HttpMethod.ALL` is not an outbound call. */
export const OutboundHttpMethods = [
	HttpMethod.GET,
	HttpMethod.POST,
	HttpMethod.PUT,
	HttpMethod.PATCH,
	HttpMethod.DELETE,
	HttpMethod.HEAD,
	HttpMethod.OPTIONS,
] as const;

export type OutboundHttpMethod = typeof OutboundHttpMethods[number];

const BodyMethods = new Set<string>([
	HttpMethod.POST,
	HttpMethod.PUT,
	HttpMethod.PATCH,
] satisfies HttpMethod_Body[]);

export const httpRequestMethodAllowsBody = (method: string): boolean => BodyMethods.has(method);

/**
 * Persisted outbound call. `{{key}}` is caller data. `{{secret:name}}` is resolved
 * by the backend from a secret manager and is never logged after substitution.
 */
export type HttpRequestDef = {
	method: OutboundHttpMethod;
	url: string;
	headers?: StringMap;
	body?: string;
	timeout?: number;
};

export const emptyHttpRequest = (): HttpRequestDef => ({
	method: HttpMethod.POST,
	url: '',
	headers: {},
	body: '',
});
