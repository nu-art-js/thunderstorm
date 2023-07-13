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


import {DBApiConfig, ModuleBE_BaseDBV2} from '@nu-art/db-api-generator/backend/ModuleBE_BaseDBV2';
import {ProxyServiceAccount} from '../../shared/proxy-v2/types';
import {DBDef_RemoteProxy} from '../../shared/proxy-v2/db-def';

export type RemoteProxyConfig = DBApiConfig<ProxyServiceAccount> & {}

export class ModuleBE_RemoteProxyV2_Class
	extends ModuleBE_BaseDBV2<ProxyServiceAccount, RemoteProxyConfig> {

	constructor() {
		super(DBDef_RemoteProxy);
	}

	init() {
	}
}

export const ModuleBE_RemoteProxyV2 = new ModuleBE_RemoteProxyV2_Class();