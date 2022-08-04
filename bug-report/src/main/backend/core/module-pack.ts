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
 */

import {ModuleBE_BugReport} from '../modules/ModuleBE_BugReport';
import {ModuleBE_AdminBR} from '../modules/ModuleBE_AdminBR';
import {JiraBugReportIntegrator} from '../modules/JiraBugReportIntegrator';
import {JiraModule} from '@nu-art/jira/backend';
import {SlackBugReportIntegrator} from '../modules/SlackBugReportIntegrator';
import {SlackModule} from '@nu-art/storm/slack';


export const ModulePack_Backend_BugReport = [
	ModuleBE_BugReport,
	ModuleBE_AdminBR,
	JiraBugReportIntegrator,
	JiraModule,
	SlackBugReportIntegrator,
	SlackModule
];