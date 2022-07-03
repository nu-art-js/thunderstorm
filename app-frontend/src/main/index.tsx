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
import {ForceUpgrade, Thunder, ToastBuilder} from '@nu-art/thunderstorm/frontend';
import {LiveDocsModule, ModulePack_Frontend_LiveDocs} from '@nu-art/live-docs/frontend';
import {ExampleModule} from '@modules/ExampleModule';
import {ModulePack_Frontend_PushPubSub} from '@nu-art/push-pub-sub/frontend';
import {BugReportModule} from '@nu-art/bug-report/frontend';
import {Module} from '@nu-art/ts-common';
import {ModulePack_Frontend_Uploader} from '@nu-art/file-upload/frontend';
import {PermissionsFE} from '@nu-art/permissions/frontend';


const modules: Module[] = [
	ForceUpgrade,
	ExampleModule,
	BugReportModule
];
PermissionsFE.setDefaultConfig({projectId: 'thunderstorm-staging'});

new Thunder()
	.setConfig(require('./config').config)
	.addModules(...ModulePack_Frontend_PushPubSub)
	.addModules(...ModulePack_Frontend_LiveDocs)
	.addModules(...ModulePack_Frontend_Uploader)
	.addModules(...modules)
	.setMainApp(App)
	.build();

LiveDocsModule.setActionsResolver((docKey: string) => {
	const doc = LiveDocsModule.get(docKey);

	return new ToastBuilder().setContent(doc.document.length === 0 ? `No Content for document with key: ${docKey}` : doc.document);
});