/*
 * A generic push pub sub infra for webapps
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

import {__scenario} from '@nu-art/testelot';
import {Tester} from './_core/Tester';
import {FirebaseModule} from '@nu-art/firebase/backend';
import {ModuleBE_PushPubSub} from '../main/backend/modules/ModuleBE_PushPubSub';
import {scenarioCleanup} from './cleaup';


const mainScenario = __scenario('Push Pub Sub Test');
mainScenario.add(scenarioCleanup);

module.exports = new Tester()
	.addModules(FirebaseModule, ModuleBE_PushPubSub)
	.setScenario(mainScenario)
	.build();