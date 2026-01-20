/*
 * Database API infrastructure library for Thunderstorm.
 *
 * HTTP helper functions for database API operations using http-client.
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

import {ApiDef, BodyApi, HttpException, HttpMethod_Body, HttpMethod_Query, HttpRequest, QueryApi} from '@nu-art/http-client';
import {HttpClient} from '@nu-art/http-client';


type ApiQueryReturnType<API extends QueryApi<any, any, any, any, HttpMethod_Query>> = API['IP'] extends undefined ? () => HttpRequest<API> : (params: API['IP']) => HttpRequest<API>
type ApiBodyReturnType<API extends BodyApi<any, any, any, any, HttpMethod_Body>> = API['IB'] extends undefined ? () => HttpRequest<API> : (params: API['IB']) => HttpRequest<API>

/**
 * Creates a typed HTTP request function for query-based APIs (GET, DELETE).
 *
 * Returns a function that accepts query parameters and returns a configured HttpRequest.
 * The request can be further customized or executed.
 *
 * @template API - Query API type definition
 * @param apiDef - API definition with method, path, and optional configuration
 * @param onCompleted - Optional completion callback
 * @param onError - Optional error callback
 * @returns Function that accepts query parameters and returns HttpRequest
 */
export function apiWithQuery<API extends QueryApi<any, any, any, any, HttpMethod_Query>>(apiDef: ApiDef<API>,
																						 onCompleted?: (response: API['R'], params: API['IP'], request: HttpRequest<API>) => Promise<any>,
																						 onError?: (errorResponse: HttpException<API['E']>, input: API['IP'], request: HttpRequest<API>) => Promise<any>): ApiQueryReturnType<API> {
	return ((params: API['IP']): HttpRequest<API> => {
		return HttpClient
			.createRequest<API>(apiDef)
			.setUrlParams(params)
			.setTimeout(apiDef.timeout || 10000)
			.setOnError(onError)
			.setOnCompleted(onCompleted);
	}) as ApiQueryReturnType<API>;
}

/**
 * Creates a typed HTTP request function for body-based APIs (POST, PUT, PATCH).
 *
 * Returns a function that accepts a request body and returns a configured HttpRequest.
 * The request can be further customized or executed.
 *
 * @template API - Body API type definition
 * @param apiDef - API definition with method, path, and optional configuration
 * @param onCompleted - Optional completion callback
 * @param onError - Optional error callback
 * @returns Function that accepts body and returns HttpRequest
 */
export function apiWithBody<API extends BodyApi<any, any, any, any, HttpMethod_Body>>(apiDef: ApiDef<API>,
																					  onCompleted?: (response: API['R'], body: API['IB'], request: HttpRequest<API>) => Promise<any>,
																					  onError?: (errorResponse: HttpException<API['E']>, input: API['IP'] | API['IB'], request: HttpRequest<API>) => Promise<any>): ApiBodyReturnType<API> {
	return ((body: API['IB']): HttpRequest<API> => {
		return HttpClient
			.createRequest<API>(apiDef)
			.setBodyAsJson(body)
			.setTimeout(apiDef.timeout || 10000)
			.setOnError(onError)
			.setOnCompleted(onCompleted);
	}) as ApiBodyReturnType<API>;
}
