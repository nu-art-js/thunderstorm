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

	getServerPort() {
		return 4001;
	}
}

module.exports = new DevConfig();