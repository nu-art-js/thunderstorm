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

import {
	__stringify,
	ApiException,
	BadImplementationException,
	compareVersions,
	ImplementationMissingException,
	Module
} from '@nu-art/ts-common';

import {
	ApiDef_ForceUpgrade,
	Browser,
	HeaderKey_AppVersion,
	HeaderKey_BrowserType,
	HeaderKey_UserAgent,
	UpgradeRequired
} from '../../shared';
import {ServerApi_Middleware} from '../utils/types';
import {createQueryServerApi} from '../core/typed-api';
import {HeaderKey} from './server/HeaderKey';
import {addRoutes} from './ModuleBE_APIs';


type VersionConfig = {
	regexp: {
		[K in Browser]: string
	}
	browser: {
		[K in Browser]: string
	},
	app: string
};

const Header_AppVersion = new HeaderKey(HeaderKey_AppVersion);
const Header_BrowserType = new HeaderKey(HeaderKey_BrowserType);
const Header_UserAgent = new HeaderKey(HeaderKey_UserAgent);

const DefaultRegexps: { [k in Browser]: string } = {
	chrome: 'Chrome/([0-9\.]+)'
};

class ModuleBE_ForceUpgrade_Class
	extends Module<VersionConfig> {
	static readonly Middleware: ServerApi_Middleware = async () => ModuleBE_ForceUpgrade.assertVersion();

	constructor() {
		super();
	}

	init() {
		super.init();
		addRoutes([createQueryServerApi(ApiDef_ForceUpgrade.v1.assertAppVersion, async (params) => {
			return this.compareVersion();
		})]);
	}

	compareVersion(): UpgradeRequired {
		const appVersion = Header_AppVersion.get();
		const userAgentString = Header_UserAgent.get();
		const browserType: Browser = Header_BrowserType.get() as Browser;
		if (!browserType)
			throw new ImplementationMissingException(`Browser type not specified`);

		const chromeRegexp = this.config.regexp?.[browserType] || DefaultRegexps[browserType];
		const version = userAgentString.match(new RegExp(chromeRegexp))?.[1];
		if (!version)
			throw new BadImplementationException(`Error extracting version.. \nUserAgent: '${userAgentString}'\n config: '${__stringify(this.config)}'`);

		const requiredBrowserVersion = this.config.browser?.[browserType];
		if (!requiredBrowserVersion)
			throw new ImplementationMissingException(`Unsupported browser type: ${browserType}`);

		let app = false;
		let browser = false;
		if (this.config.app)
			app = compareVersions(appVersion, this.config.app) === 1;

		if (requiredBrowserVersion)
			browser = compareVersions(version, requiredBrowserVersion) === 1;

		return {type: 'upgrade-required', data: {app, browser}};
	}

	async assertVersion(): Promise<void> {
		const upgradeRequired = this.compareVersion();
		if (upgradeRequired.data.app || upgradeRequired.data.browser)
			throw new ApiException<UpgradeRequired>(426, 'require upgrade..').setErrorBody(upgradeRequired);
	}
}

export const ModuleBE_ForceUpgrade = new ModuleBE_ForceUpgrade_Class();