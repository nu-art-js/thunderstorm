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

import {Dispatcher, Module} from '@nu-art/ts-common';
import {ModuleFE_XhrHttp} from './http/ModuleFE_XhrHttp';
import {
	ApiDef,
	ApiDef_ForceUpgrade,
	ApiDefCaller,
	ApiStruct_ForceUpgrade,
	HeaderKey_AppVersion,
	HeaderKey_BrowserType,
	HttpMethod,
	QueryApi,
	UpgradeRequired
} from '../../shared';
import {browserType} from '../utils/tools';
import {apiWithQuery} from '../core/typed-api';


type Config = {
	assertVersionUrl: string
}

export interface OnUpgradeRequired {
	__onUpgradeRequired(response: UpgradeRequired): void;
}

export interface OnUpgradeRequired {
	__onUpgradeRequired(response: UpgradeRequired): void;
}

const dispatch_onUpgradeRequired = new Dispatcher<OnUpgradeRequired, '__onUpgradeRequired'>('__onUpgradeRequired');

class ModuleFE_ForceUpgrade_Class
	extends Module<Config>
	implements ApiDefCaller<ApiStruct_ForceUpgrade> {
	readonly v1: ApiDefCaller<ApiStruct_ForceUpgrade>['v1'];

	constructor() {
		super();
		this.v1 = {
			assertAppVersion: apiWithQuery(ApiDef_ForceUpgrade.v1.assertAppVersion)
		};
	}

	protected init(): void {
		ModuleFE_XhrHttp.addDefaultHeader(HeaderKey_AppVersion, `${process.env.appVersion}`);
		ModuleFE_XhrHttp.addDefaultHeader(HeaderKey_BrowserType, `${browserType()}`);
	}

	compareVersion = () => {
		const def: ApiDef<QueryApi<UpgradeRequired>> =
			{method: HttpMethod.GET, path: this.config.assertVersionUrl};

		// this.v1.assertAppVersion({}).execute((response) => {
		// 	dispatch_onUpgradeRequired.dispatchModule(response);
		// });
		ModuleFE_XhrHttp
			.createRequest(def)
			.setRelativeUrl(this.config.assertVersionUrl)
			.execute((response) => {
				dispatch_onUpgradeRequired.dispatchModule(response);
			});
	};

	async __postInit() {

	}
}

export const ModuleFE_ForceUpgrade = new ModuleFE_ForceUpgrade_Class();