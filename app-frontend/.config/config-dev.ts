/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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

export const config = {
	HttpModule: {
		// origin: "http://192.168.1.5:3000",
		origin: "http://localhost:5000/thunderstorm-staging/us-central1/api",
		timeout: 30000
	},
	frontend: {
		// origin: "http://192.168.1.5:3010",
		origin: "http://localhost:5001",
	},
	FirebaseModule: {
		local: {
			apiKey: "AIzaSyD2xhGl4-gq3L_rknxoYF0KZLvedrFWQbg",
			authDomain: "thunderstorm-staging.firebaseapp.com",
			databaseURL: "https://thunderstorm-staging.firebaseio.com",
			projectId: "thunderstorm-staging",
			storageBucket: "thunderstorm-staging.appspot.com",
			messagingSenderId: "387990980732",
			appId: "1:387990980732:web:62ce3fe05f0fc852faa1f9",
			measurementId: "G-PSCS2QH5YV"
		}
	},
	PushPubSubModule: {
		publicKeyBase64: 'BH_Awj-nfzwZBMnzRgyfQN2mIZPbxV9JqLWljlQcJbHtz-2IxKPvon78Wt_NLF0yn4QkMIErSlqkAm8T75ySM84'
	},
	ExampleModule: {
		remoteUrl: "/v1/sample/endpoint-example"
	},
	ForceUpgrade: {
		assertVersionUrl: "/v1/version/assert"
	},
	LocaleModule: {
		defaultLocale: "en",
		locales: [
			{
				locale: "en",
				label: "Language_English",
				icon: "languages/en",
				texts: require(`./res/localization/en`)
			},
			{
				locale: "nl",
				label: "Language_Dutch",
				icon: "languages/nl",
				texts: require(`./res/localization/nl`)
			}
		]
	}
};