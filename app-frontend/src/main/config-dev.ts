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

module.exports = {
	HttpModule: {
		// origin: "http://192.168.1.5:3000",
		origin: "http://localhost:3333",
		timeout: 10000
	},
	frontend: {
		// origin: "http://192.168.1.5:3010",
		origin: "http://localhost:5010",
	},
	LocalizationModule: {
		defaultLocale: "en",
		locales: {
			"en": {
				label: "Language_English",
				icon: "languages/en",
			},
			"nl": {
				label: "Language_Dutch",
				icon: "languages/nl"
			}
		},
		languages: {
			"en": require(`./res/localization/en`),
			"nl": require(`./res/localization/nl`),
		}
	}
};