/*
 * A typescript & react boilerplate with api call example
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

// tslint:disable:no-import-side-effect
import './res/styles/styles.scss';

import {App} from './app/App';
import {ModuleFE_ForceUpgrade, Thunder} from '@thunder-storm/core/frontend';
import {ModulePack_Frontend_LiveDocs} from '@thunder-storm/live-docs/frontend';
import {ExampleModule} from '@modules/ExampleModule';
import {ModulePack_Frontend_PushPubSub} from '@nu-art/push-pub-sub/frontend';
import {ModuleFE_BugReport} from '@nu-art/bug-report/frontend';
import {Module} from '@thunder-storm/common';
import {ModulePack_Frontend_Uploader} from '@nu-art/file-upload/frontend';
import {ModuleFE_Permissions} from '@thunder-storm/permissions/frontend';


const modules: Module[] = [
	ModuleFE_ForceUpgrade,
	ExampleModule,
	ModuleFE_BugReport
];
ModuleFE_Permissions.setDefaultConfig({projectId: 'thunderstorm-staging'});

new Thunder()
	.setConfig(require('./config').config)
	.addModules(...ModulePack_Frontend_PushPubSub)
	.addModules(...ModulePack_Frontend_LiveDocs)
	.addModules(...ModulePack_Frontend_Uploader)
	.addModules(...modules)
	.setMainApp(App)
	.build();