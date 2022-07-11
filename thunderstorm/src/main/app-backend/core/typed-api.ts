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

import {ApiResponse, ServerApi_Get, ServerApi_Post} from '../../backend';
import {ApiDef, BodyApi, QueryApi} from '../shared';
import {ExpressRequest} from '../utils/types';


export class _ServerQueryApi<API extends QueryApi<any, any, any>>
	extends ServerApi_Get<API> {
	private readonly action: (params: API['P'], request?: ExpressRequest) => Promise<API['R']>;

	constructor(apiDef: ApiDef<API>, action: (params: API['P'], request?: ExpressRequest) => Promise<API['R']>) {
		super(apiDef);
		this.action = action;
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: API['P']): Promise<API['R']> {
		return this.action(queryParams, request);
	}
}

export class _ServerBodyApi<API extends BodyApi<any, any, any>>
	extends ServerApi_Post<API> {
	private readonly action: (body: API['B'], request?: ExpressRequest) => Promise<API['R']>;

	constructor(apiDef: ApiDef<API>, action: (params: API['B'], request?: ExpressRequest) => Promise<API['R']>) {
		super(apiDef);
		this.action = action;
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: never, body: API['B']): Promise<API['R']> {
		return this.action(body, request);
	}
}

export function createQueryServerApi<API extends QueryApi<any, any, any>>(apiDef: ApiDef<API>, action: (params: API['P'], request?: ExpressRequest) => Promise<API['R']>) {
	return new _ServerQueryApi<API>(apiDef, action);
}

export function createBodyServerApi<API extends BodyApi<any, any, any>>(apiDef: ApiDef<API>, action: (body: API['B'], request?: ExpressRequest) => Promise<API['R']>) {
	return new _ServerBodyApi<API>(apiDef, action);
}
