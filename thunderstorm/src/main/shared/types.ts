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

import {ObjectTS} from '@nu-art/ts-common';


export enum HttpMethod {
	ALL = 'all',
	POST = 'post',
	GET = 'get',
	PATCH = 'patch',
	DELETE = 'delete',
	PUT = 'put',
	OPTIONS = 'options',
	HEAD = 'head',
}

export type HttpMethod_Query = 'get' | 'delete'
export type HttpMethod_Body = 'post' | 'put' | 'patch'
export type HttpMethod_Empty = 'options' | 'head'

export type QueryParams = { [key: string]: string | number | undefined; };

export type TypedApi<M extends string, R, B, P extends QueryParams> = {
	M: M,
	R: R,
	B: B,
	P: P,
}

export type BodyApi<R, B, M extends HttpMethod_Body = HttpMethod.POST, P extends QueryParams = never> = TypedApi<M, R, B, P>
export type QueryApi<R, P extends QueryParams = QueryParams, M extends HttpMethod_Query = HttpMethod.GET, B = never> = TypedApi<M, R, B, P>
export type EmptyApi<R, M extends HttpMethod_Empty, P extends QueryParams = never, B = never> = TypedApi<M, R, B, P>

export type ApiDef<API extends TypedApi<any, any, any, any>> = {
	method: API['M'],
	baseUrl?: string
	pathPrefix?: string
	path: string
}

export type ApiResolver<K> = K extends ApiDef<infer API> ? API : never

export type ErrorBody<E extends ObjectTS | void = void> = {
	type: string
	body: E
};

export type  ErrorResponse<E extends ObjectTS | void = void> = {
	debugMessage?: string
	error?: ErrorBody<E>
}

export type ApiDefCaller<K> = K extends ObjectTS ? ApiRouter<K> | ApiCaller<K> :
	ApiCaller<K>;

export type ApiCaller<API> = API extends QueryApi<any, any, any> ? (query: API['P']) => void | Promise<API['R']> :
	API extends BodyApi<any, any, any> ? (body: API['B']) => void | Promise<API['R']> :
		API extends TypedApi<any, any, any, any> ? (body: API['B'], query: API['P']) => void | Promise<API['R']> : never;

export type ApiRouter<T extends ObjectTS> = { [P in keyof T]: ApiDefCaller<T[P]> };