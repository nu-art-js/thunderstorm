/*
 * A typescript & react boilerplate with api call example
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

/**
 * Created by tacb0ss on 01/10/2018.
 */

const WebpackEnvConfig = require('./_base.js');

class ProdConfig
	extends WebpackEnvConfig {

	jsxMinify() {
		"".format(443,"sfs")
		return true;
	}

	cssMinify() {
		return true;
	}

	outputFolder() {
		return "prod";
	}

	resolveGtmScript() {
		return WebpackEnvConfig._resolveGtmScript("GTM-PROD")
	}

	htmlMinificationOptions() {
		return {
			removeComments: true,
			collapseWhitespace: true,
			removeRedundantAttributes: true,
			useShortDoctype: true,
			removeEmptyAttributes: true,
			removeStyleLinkTypeAttributes: true,
			keepClosingSlash: true,
			minifyJS: true,
			minifyCSS: true,
			minifyURLs: true
		};
	}

	getPrettifierPlugin() {
	}

	getDevServerSSL() {
	}

	getServerPort() {
		return 5000;
	}
}

module.exports = new ProdConfig();