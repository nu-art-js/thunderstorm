/*
 * A typescript & react boilerplate with api call example
 *
 * Copyright (C) 2018  Adam van der Kruk aka TacB0sS
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

// tslint:disable-next-line:no-import-side-effect
import './res/styles/styles.scss';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
	BeLogged,
	LogClient_Browser,
	Module
} from "@nu-art/ts-common";
import {App} from "./app/App";
import {
	AppWrapper,
	BrowserHistoryModule,
	HttpModule,
	LocalizationModule,
	ResourcesModule,
	StorageModule,
	Thunder,
	ToastBuilder
} from "@nu-art/thunder";
import {ExampleModule} from "@modules/ExampleModule";
import {
	LiveDocActionResolver,
	LiveDocsModule,
	showEditModalExample
} from "@nu-art/live-docs/frontend";

BeLogged.addClient(LogClient_Browser);

const modules: Module<any>[] = [
	HttpModule,
	LiveDocsModule,
	LocalizationModule,
	StorageModule,
	BrowserHistoryModule,
	ResourcesModule,
	ExampleModule,
];

const config = require("./config").config;
Thunder.setConfig(config).setModules(...modules).init();
Thunder.setMainApp(App);

const resolver: LiveDocActionResolver = (docKey: string) => {
	let doc = LiveDocsModule.get(docKey);

	return new ToastBuilder().setContent(doc.document.length === 0 ? `No Content for document with key: ${docKey}` : doc.document).setActions(
		[<button style={{marginRight: 8}} onClick={() => showEditModalExample(docKey)}>MOSHE</button>]);
}
LiveDocsModule.setActionsResolver(resolver);

ReactDOM.render(
	<AppWrapper Thunder={Thunder}/>,
	document.getElementById('app')
);
