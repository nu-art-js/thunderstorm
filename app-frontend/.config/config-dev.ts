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
		origin: 'https://us-central1-thunderstorm-dev.cloudfunctions.net/api',
		timeout: 10000,
		compress: false
	},
	frontend: {
		origin: 'https://thunderstorm-dev.firebaseapp.com',
	},
	ExampleModule: {
		remoteUrl: 'v1/sample/endpoint-example'
	},
	ForceUpgrade: {
		assertVersionUrl: 'v1/version/assert'
	},
	ModuleBE_Firebase: {
		local: {
			apiKey: 'AIzaSyCJLJVKbawZNk65axa3f9Q4Ln1KJS8kU6E',
			authDomain: 'thunderstorm-dev.firebaseapp.com',
			databaseURL: 'https://thunderstorm-dev-default-rtdb.firebaseio.com',
			projectId: 'thunderstorm-dev',
			storageBucket: 'thunderstorm-dev.appspot.com',
			messagingSenderId: '264427159921',
			appId: '1:264427159921:web:8dc32d3f68fd626948f6d0',
			measurementId: 'G-CRDNK2N2WT'
		}
	},
	ModuleBE_PushPubSub: {
		publicKeyBase64: 'BCy8PJkgH11j6CnS470_zewKNSxJ_cFOB1JGolNA5s5CypBHC-yWyB6FVmq912wUv9psxCdny3JfDMXEjQUT6nY'
	}
};
