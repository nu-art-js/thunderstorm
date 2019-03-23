/*
 * A typescript & react boilerplate with api call example
 *
 * Copyright (C) 2018  Adam van der Kruk aka TacB0sS
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
const HtmlBeautifyPlugin = require('html-beautify-webpack-plugin');
const fs = require('fs');

class DevConfig
	extends WebpackEnvConfig {

	jsxMinify() {
		return false;
	}

	cssMinify() {
		return false;
	}

	outputFolder() {
		return "dev";
	}

	resolveGtmScript() {
		return WebpackEnvConfig._resolveGtmScript("GTM-DEV")
	}

	htmlMinificationOptions() {
	}

	getPrettifierPlugin() {
		return new HtmlBeautifyPlugin({
			config: {
				html: {
					end_with_newline: true,
					indent_size: 2,
					indent_with_tabs: true,
					indent_inner_html: true,
					preserve_newlines: true,
					unformatted: [
						'i',
						'b',
						'span'
					]
				}
			},
			replace: [' type="text/javascript"']
		})
	}

	getDevServerSSL() {
		return {
			key: fs.readFileSync('../_config/dev-cert/server-key.pem'),
			cert: fs.readFileSync('../_config/dev-cert/server-cert.pem'),
			// ca: fs.readFileSync('/path/to/ca.pem')
		}
	}

	getHostingPort() {
		return 3334;
	}
}

module.exports = new DevConfig();