/*
 * Allow the user to file a bug  report directly from your app
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
 */'../main/frontend/modules/JiraModule';
import {Tester} from './_core/Tester.js';
import {issueScenario} from './jira/issue.js';


const mainScenario = __scenario('Bug Report Testing');
mainScenario.add(issueScenario);

const email = 'email';
const key = 'key';
JiraModule.setDefaultConfig({auth: {email: email, apiKey: key}});

module.exports = new Tester()
	.addModules(JiraModule)
	.setScenario(mainScenario)
	.build();