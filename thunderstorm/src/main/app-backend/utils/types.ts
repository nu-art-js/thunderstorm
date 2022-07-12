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

import * as express from 'express';
import {Dispatcher, TS_Object} from '@nu-art/ts-common';
import {CoreOptions, UriOptions} from 'request';
import {BodyApi, QueryApi, TypedApi} from '../../shared/types';
import {ServerApi, ServerApi_Get, ServerApi_Post} from '../modules/server/server-api';


export type Express = express.Express
export type ExpressRouter = express.Router
export type ExpressRequest = express.Request<any>
export type ExpressResponse = express.Response
export type ExpressRequestHandler = express.RequestHandler

export interface QueryRequestInfo {
	__queryRequestInfo(request: ExpressRequest): Promise<{ key: string, data: any }>;
}

export type RequestOptions = CoreOptions & UriOptions
export const dispatch_queryRequestInfo = new Dispatcher<QueryRequestInfo, '__queryRequestInfo'>('__queryRequestInfo');

export type ApiDefServer<K> = K extends TypedApi<any, any, any, any> ? ApiServer<K> : ApiServerRouter<K>;

export type ApiServerRouter<T extends TS_Object> = { [P in keyof T]: ApiDefServer<T[P]> };

export type ApiServer<API> =
	API extends QueryApi<any, any, any> ? ServerApi_Get<API> :
		API extends BodyApi<any, any, any> ? ServerApi_Post<API> :
			API extends TypedApi<any, any, any, any> ? ServerApi<API> : never;
