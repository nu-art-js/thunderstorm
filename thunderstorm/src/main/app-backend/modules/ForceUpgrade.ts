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
	BadImplementationException,
	compareVersions,
	Module,
	ImplementationMissingException
} from "@nu-art/ts-common";
import {
	HeaderKey,
	ServerApi_Middleware
} from "./server/HttpServer";

import {ApiException} from "../exceptions";
import {
	HeaderKey_AppVersion,
	HeaderKey_BrowserType,
	HeaderKey_UserAgent,
	UpgradeRequired
} from "../../shared/force-upgrade";
import {Browser} from "../../shared/consts";
import {ExpressRequest} from "../utils/types";

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
	chrome: "Chrome/([0-9\.]+)"
};

class ForceUpgrade_Class
	extends Module<VersionConfig> {

	static readonly Middleware: ServerApi_Middleware = async (request: ExpressRequest) => ForceUpgrade.assertVersion(request);

	compareVersion(request: ExpressRequest): UpgradeRequired {
		const appVersion = Header_AppVersion.get(request);
		const userAgentString = Header_UserAgent.get(request);
		const browserType: Browser = Header_BrowserType.get(request) as Browser;
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

		return {app, browser}
	}

	async assertVersion(request: ExpressRequest): Promise<void> {
		const upgradeRequired = this.compareVersion(request);
		if (upgradeRequired.app || upgradeRequired.browser)
			throw new ApiException<UpgradeRequired>(426, "require upgrade..").setErrorBody({type: "upgrade-required", body: upgradeRequired})
	}
}

export const ForceUpgrade = new ForceUpgrade_Class();