/*
 * @nu-art/http-server - Express HTTP server and typed ServerApi
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';
import type {QueryParams} from '@nu-art/api-types';
import type {IncomingHttpHeaders} from 'http';
import type {ExpressRequest} from './types.js';
import type {ApiResponse, ServerApi} from './ServerApi.js';

export const MemKey_ServerApi = new MemKey<ServerApi<any>>('server-api', true);
export const MemKey_HttpRequest = new MemKey<ExpressRequest>('http-request', true);
export const MemKey_HttpResponse = new MemKey<ApiResponse>('http-response', true);
export const MemKey_HttpRequestHeaders = new MemKey<IncomingHttpHeaders>('http-request--incoming-headers', true);
export const MemKey_HttpRequestBody = new MemKey<any>('http-request--incoming-body', true);
export const MemKey_HttpRequestQuery = new MemKey<QueryParams>('http-request--query', true);
export const MemKey_HttpRequestUrl = new MemKey<string>('http-request--url', true);
export const MemKey_HttpRequestPath = new MemKey<string>('http-request--original-url', true);
export const MemKey_HttpRequestMethod = new MemKey<any>('http-request--method', true);
