/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
 *
 * Copyright (C) 2020 Intuition Robotics
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

import {
	__custom,
	__scenario
} from "@intuitionrobotics/testelot";
import {FirebaseModule} from "@intuitionrobotics/firebase/backend";
import {MyTester} from "./core";
import {AxiosHttpModule} from "@intuitionrobotics/thunderstorm/app-backend/modules/http/AxiosHttpModule";
import {HttpMethod} from "@intuitionrobotics/thunderstorm";

AxiosHttpModule.setDefaultConfig({origin: 'sjdfojds'});
const mainScenario = __scenario("File Uploading Testing");
const googleCall = __custom(async () => {
	try {
		await AxiosHttpModule
			.createRequest(HttpMethod.GET, 'google call')
			.setUrl('https://google.com/')
			.setHeaders({'a': 'b'})
			.setOnError(() => {
				console.log('something is wrong');
			})
			.executeSync();
		console.log('works');

	} catch (e) {
		console.log('breaks');
		console.log(e);
	}
}).setLabel('Headers');
mainScenario.add(googleCall);
// mainScenario.add(parseApk);

module.exports = new MyTester()
	.addModules(FirebaseModule)
	.setScenario(mainScenario)
	.build();
