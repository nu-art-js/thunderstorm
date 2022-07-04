/*
 * Live-Docs will allow you to add and edit tool-tips from within your app...
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

import {ApiDef, BodyApi, HttpMethod, QueryApi} from '@nu-art/thunderstorm';
import {DB_Document, LiveDocHistoryReqParams, LiveDocReqParams, Request_UpdateDocument} from './types';


export type ApiStruct_LiveDoc = {
	v1: {
		get: QueryApi<DB_Document, LiveDocReqParams>,
		history: QueryApi<void, LiveDocHistoryReqParams>,
		upsert: BodyApi<DB_Document, Request_UpdateDocument>,
	},
}

export const ApiDef_LiveDoc_Get: ApiDef<ApiStruct_LiveDoc['v1']['get']> = {
	method: HttpMethod.GET,
	path: 'v1/live-docs/unique'
};

export const ApiDef_LiveDoc_History: ApiDef<ApiStruct_LiveDoc['v1']['history']> = {
	method: HttpMethod.GET,
	path: 'v1/live-docs/change-history'
};

export const ApiDef_LiveDoc_Upsert: ApiDef<ApiStruct_LiveDoc['v1']['upsert']> = {
	method: HttpMethod.POST,
	path: 'v1/live-docs/upsert'
};

