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
	XhrHttpModule: {
		origin: "http://localhost:5000/local-ts-testing-alan/us-central1/api",
		timeout: 30000,
		compress: false
	},
	FirebaseModule: {
		local: {
			apiKey: "AIzaSyC7oQCgSOtI-tBM-AUGVeq3Mms6T9wgkKM",
			authDomain: "local-ts-testing-alan.firebaseapp.com",
			databaseURL: "https://local-ts-testing-alan.firebaseio.com",
			projectId: "local-ts-testing-alan",
			storageBucket: "local-ts-testing-alan.appspot.com",
			messagingSenderId: "278437548852",
			appId: "1:278437548852:web:5e33e4c12174b60eb98b61",
			measurementId: "G-MNTQ9CCT9K"
		},
	},
	PushPubSubModule: {
		publicKeyBase64: 'BMDTPilO0jte6ADpa0VNzY300AXBZNXClyOUHD9ZfJNByuTtQ6c1rDTSIfLnX8SNgsgaL8skhqaAeiDaYNZeOpg'
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