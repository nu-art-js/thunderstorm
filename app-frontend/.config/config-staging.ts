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
		origin: 'https://us-central1-thunderstorm-staging.cloudfunctions.net/api',
		timeout: 10000
	},
	frontend: {
		origin: 'https://thunderstorm-staging.firebaseapp.com',
	},
	ExampleModule: {
		remoteUrl: 'v1/sample/endpoint-example'
	},
	ForceUpgrade: {
		assertVersionUrl: 'v1/version/assert'
	},
	FirebaseModule: {
		local: {
			apiKey: 'AIzaSyD2xhGl4-gq3L_rknxoYF0KZLvedrFWQbg',
			authDomain: 'thunderstorm-staging.firebaseapp.com',
			databaseURL: 'https://thunderstorm-staging.firebaseio.com',
			projectId: 'thunderstorm-staging',
			storageBucket: 'thunderstorm-staging.appspot.com',
			messagingSenderId: '387990980732',
			appId: '1:387990980732:web:62ce3fe05f0fc852faa1f9',
			measurementId: 'G-PSCS2QH5YV'
		}
	},
	ModuleBE_PushPubSub: {
		publicKeyBase64: 'BBsKBw0R-mITlCSAOtCiHCLvKl-EetCmt5JKMg8L8ev1GqBEpDryum8ve3htIlbN3cjV1MLDFQnk0a8Wfks7cFk'
	}
};
