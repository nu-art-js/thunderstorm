/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {ApiDef, HttpClient_Class, HttpConfig, HttpMethod, GeneralApi} from '../main/index.js';

/**
 * Creates a test HttpClient with the specified origin and optional config
 */
export function createTestClient(origin: string = 'https://httpbin.org', config?: Partial<HttpConfig>): HttpClient_Class {
	const client = new HttpClient_Class({
		origin,
		timeout: 30000,
		compress: false,
		...config
	});
	return client;
}

/**
 * Asserts that a response from httpbin.org has the expected structure
 */
export function assertHttpBinResponse(response: any): void {
	if (!response || typeof response !== 'object') {
		throw new Error('Expected httpbin response to be an object');
	}
}

/**
 * Creates a test API definition
 */
export function createTestApiDef<API extends GeneralApi>(
	method: HttpMethod,
	path: string
): ApiDef<API> {
	return {method, path} as ApiDef<API>;
}
