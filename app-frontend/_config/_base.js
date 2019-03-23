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

const fs = require('fs');

class WebpackEnvConfig {
	static _resolveGtmScript(gtmId) {
		return `\n${fs.readFileSync("./src/main/scripts/gtm.js", "utf8")}\ngtm(window, document, 'script', 'dataLayer', "${gtmId}");`
	}

	jsxMinify() {
		throw new Error("Abstract method");
	}

	cssMinify() {
		throw new Error("Abstract method");
	}

	outputFolder() {
		throw new Error("Abstract method");
	}

	resolveGtmScript() {
		throw new Error("Abstract method");
	}

	resolveFcmScript() {
		return `\n${fs.readFileSync("./src/main/scripts/fcm.js", "utf8")};`
	}

	htmlMinificationOptions() {
		throw new Error("Abstract method");
	}

	getPrettifierPlugin() {
		throw new Error("Abstract method");
	}

	getDevServerSSL() {
		throw new Error("Abstract method");
	}

	getHostingPort() {
		throw new Error("Abstract method");
	}
}

module.exports = WebpackEnvConfig;