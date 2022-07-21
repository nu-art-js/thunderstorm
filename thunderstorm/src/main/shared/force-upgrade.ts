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

import {ApiDef, ApiDefResolver, HttpMethod, QueryApi} from './types';


export const HeaderKey_AppVersion = 'x-app-version';
export const HeaderKey_BrowserType = 'x-browser-type';
export const HeaderKey_UserAgent = 'user-agent';

export type UpgradeRequired = {
	browser: boolean,
	app: boolean
};

export const ApiDef_AssertAppVersion: ApiDef<QueryApi<UpgradeRequired>> = {
	method: HttpMethod.GET,
	path: 'assert-app-version',
};

export type ApiStruct_ForceUpgrade = {
	v1: {
		assertAppVersion: QueryApi<UpgradeRequired>
	}
}

export const ApiDef_ForceUpgrade: ApiDefResolver<ApiStruct_ForceUpgrade> = {
	v1: {
		assertAppVersion: {method: HttpMethod.GET, path: 'assert-app-version'}
	}
};