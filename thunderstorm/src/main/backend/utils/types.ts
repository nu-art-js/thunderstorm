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
import {ApiException} from '../exceptions';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {CoreOptions, UriOptions} from 'request';


export type Express = express.Express
export type ExpressRouter = express.Router
export type ExpressRequest = express.Request<any>
export type ExpressResponse = express.Response
export type ExpressRequestHandler = express.RequestHandler

export type RequestOptions = CoreOptions & UriOptions

export type ServerApi_Middleware = (storage: MemStorage) => Promise<any>
export type HttpErrorHandler = (requestData: MemStorage, error: ApiException) => Promise<string>;
