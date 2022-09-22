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

import {DB_Object, TS_Object} from '@nu-art/ts-common';
import {BaseHttpRequest} from './BaseHttpRequest';


export type DBIndex<T extends DB_Object> = { id: string, keys: keyof T | (keyof T)[], params?: { multiEntry: boolean, unique: boolean } };

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

export type IndexKeys<T extends DB_Object, Ks extends keyof T> = { [K in Ks]: T[K] };

export type QueryParams = { [key: string]: string | number | undefined; };

/**
 * P - Params
 * B - Body
 * R - Response
 * M - Method
 * IP - Input Params
 * IB - Input Body
 */
export type TypedApi<M extends string, R, B, P extends QueryParams | undefined, IB = B, IP = P> = {
	M: M,
	R: R,
	B: B,
	P: P,
	IP: IP,
	IB: IB
}

export type BodyApi<R, B, IB = B, M extends HttpMethod_Body = HttpMethod.POST, P extends QueryParams = never> = TypedApi<M, R, B, P, IB, P>
export type QueryApi<R, P extends QueryParams | undefined = QueryParams, IP = P, M extends HttpMethod_Query = HttpMethod.GET, B = never> = TypedApi<M, R, B, P, B, IP>
export type EmptyApi<R, M extends HttpMethod_Empty, P extends QueryParams = never, B = never> = TypedApi<M, R, B, P, B, P>

export type ApiDef<API extends TypedApi<any, any, any, any>> = {
	method: API['M'],
	fullUrl?: string
	baseUrl?: string
	path: string
}

export type ApiResolver<K> = K extends ApiDef<infer API> ? API : never

export type ErrorBody<E extends TS_Object | void = void> = {
	type: string
	body: E
};

export type  ErrorResponse<E extends TS_Object | void = void> = {
	debugMessage?: string
	error?: ErrorBody<E>
}

export type ApiStruct = { [k: string]: (TypedApi<any, any, any, any> | ApiStruct) }

export type ApiDefResolver<API_Struct extends ApiStruct> = API_Struct extends TypedApi<any, any, any, any> ? ApiDef<API_Struct> : API_Struct extends ApiStruct ? ApiDefRouter<API_Struct> : never;
export type ApiDefRouter<API_Struct extends ApiStruct> = { [P in keyof API_Struct]: ApiDefResolver<API_Struct[P]> };

export type ApiDefCaller<API_Struct extends ApiStruct> = API_Struct extends TypedApi<any, any, any, any> ? ApiCaller<API_Struct> : API_Struct extends ApiStruct ? ApiCallerRouter<API_Struct> : never;
export type ApiCallerRouter<API_Struct extends ApiStruct> = { [P in keyof API_Struct]: ApiDefCaller<API_Struct[P]> };

export type ApiCaller_Query<API extends QueryApi<any, any, any>> = API['IP'] extends undefined ? () => BaseHttpRequest<API> : (query: API['IP']) => BaseHttpRequest<API>;
export type ApiCaller_Body<API extends BodyApi<any, any, any>> = API['IB'] extends undefined ? () => BaseHttpRequest<API> : (query: API['IB']) => BaseHttpRequest<API>;
export type ApiCaller_Any<API extends TypedApi<any, any, any, any>> = (body: API['IB'], query: API['IP']) => BaseHttpRequest<API>;

export type ApiCaller<API> =
	API extends QueryApi<any, any, any> ? ApiCaller_Query<API> :
		API extends BodyApi<any, any, any> ? ApiCaller_Body<API> :
			API extends TypedApi<any, any, any, any> ? ApiCaller_Any<API> : never;
