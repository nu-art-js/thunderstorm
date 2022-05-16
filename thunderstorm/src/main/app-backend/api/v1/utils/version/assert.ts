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


import {ApiBinder_AssertAppVersion, HeaderKey_AppVersion, HeaderKey_BrowserType, HeaderKey_UserAgent} from '../../../../../shared/force-upgrade';
import {ApiResponse, ServerApi} from '../../../../modules/server/server-api';
import {HttpMethod} from '../../../../../shared/types';
import {ForceUpgrade,} from '../../../../modules/ForceUpgrade';
import {ExpressRequest} from '../../../../utils/types';


class ServerApi_AssertAppVersion
	extends ServerApi<ApiBinder_AssertAppVersion> {

	constructor() {
		super(HttpMethod.GET, 'assert');
		this.addHeaderToLog(HeaderKey_AppVersion, HeaderKey_BrowserType, HeaderKey_UserAgent);
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: void) {
		return ForceUpgrade.compareVersion(request);
	}
}

module.exports = new ServerApi_AssertAppVersion();
