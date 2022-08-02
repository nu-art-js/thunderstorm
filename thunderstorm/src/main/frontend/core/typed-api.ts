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

import {ApiDef, BaseHttpRequest, BodyApi, HttpMethod_Body, QueryApi} from '../shared';
import {XhrHttpModule} from '../modules/http/XhrHttpModule';


type ApiQueryReturnType<API extends QueryApi<any, any, any, any>> = API['P'] extends undefined ? () => BaseHttpRequest<API> : (params: API['P']) => BaseHttpRequest<API>
type ApiBodyReturnType<API extends BodyApi<any, any, any, any>> = API['B'] extends undefined ? () => BaseHttpRequest<API> : (params: API['B']) => BaseHttpRequest<API>

export function apiWithQuery<API extends QueryApi<any, any>>(apiDef: ApiDef<API>,
																														 onCompleted?: (response: API['R'], params: API['P'], request: BaseHttpRequest<API>) => Promise<any>,
																														 onError?: (errorResponse: any, input: API['P'] | API['B'], request: BaseHttpRequest<API>) => Promise<any>): ApiQueryReturnType<API> {
	// @ts-ignore
	return (params: API['P']): BaseHttpRequest<API> => {
		return XhrHttpModule
			.createRequest<API>(apiDef)
			.setUrlParams(params)
			.setOnError(onError)
			.setOnCompleted(onCompleted);
	};
}

export function apiWithBody<API extends BodyApi<any, any, any, HttpMethod_Body>>(apiDef: ApiDef<API>,
																																								 onCompleted?: (response: API['R'], body: API['B'], request: BaseHttpRequest<API>) => Promise<any>,
																																								 onError?: (errorResponse: any, input: API['P'] | API['B'], request: BaseHttpRequest<API>) => Promise<any>): ApiBodyReturnType<API> {
	// @ts-ignore
	return (body: API['B']): BaseHttpRequest<API> => {
		return XhrHttpModule
			.createRequest<API>(apiDef)
			.setBodyAsJson(body)
			.setOnError(onError)
			.setOnCompleted(onCompleted);
	};
}


