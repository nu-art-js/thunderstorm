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

import {__custom, __scenario} from '@nu-art/testelot';
import {ModuleBE_Firebase} from '@thunder-storm/firebase/backend';
import {MyTester} from './core';
import {AxiosHttpModule} from '@thunder-storm/core/frontend/modules/http/AxiosHttpModule';
import {HttpMethod} from '@thunder-storm/core';
import {StaticLogger} from '@thunder-storm/common';


AxiosHttpModule.setDefaultConfig({origin: 'sjdfojds'});
const mainScenario = __scenario('File Uploading Testing');
const googleCall = __custom(async () => {
	try {
		await AxiosHttpModule
			.createRequest(HttpMethod.GET, 'google call')
			.setUrl('https://google.com/')
			.setHeaders({'a': 'b'})
			.setOnError(() => {
				StaticLogger.logWarning('something is wrong');
			})
			.executeSync();
		StaticLogger.logInfo('works');

	} catch (e: any) {
		StaticLogger.logError('breaks');
		StaticLogger.logError(e);
	}
}).setLabel('Headers');
mainScenario.add(googleCall);
// mainScenario.add(parseApk);

module.exports = new MyTester()
	.addModules(ModuleBE_Firebase)
	.setScenario(mainScenario)
	.build();
