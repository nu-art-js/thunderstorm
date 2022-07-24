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

import {TS_Object} from '@nu-art/ts-common';
import {BodyApi, QueryApi, TypedApi} from '../../shared';
import {ServerApi, ServerApi_Get, ServerApi_Post} from '../modules/server/server-api';


/**
 * 	useRoutes() {
 * 		return this.v1;
 * 	}
 */
export type ApiModule = {
	useRoutes: () => ApiServerRouter<any> | ApiServer<any>
}

export type ApiDefServer<K> = ApiModule & K extends TypedApi<any, any, any, any> ? ApiServer<K> | undefined : ApiServerRouter<K>;

export type ApiServerRouter<T extends TS_Object> = { [P in keyof T]: ApiDefServer<T[P]> };

export type ApiServer<API> =
	API extends QueryApi<any, any, any> ? ServerApi_Get<API> :
		API extends BodyApi<any, any, any> ? ServerApi_Post<API> :
			API extends TypedApi<any, any, any, any> ? ServerApi<API> : never;
