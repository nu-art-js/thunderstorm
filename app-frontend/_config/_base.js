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