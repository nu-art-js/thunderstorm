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

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Module} from "@nu-art/core";
import './res/styles/styles.scss';
import {App} from "./app/App";
import {AppWrapper, BrowserHistoryModule, Fronzy, HttpModule, LocalizationModule, ResourcesModule, StorageModule} from "@nu-art/fronzy";
import {config} from "./config";

const modules: Module<any>[] = [HttpModule, LocalizationModule, StorageModule, BrowserHistoryModule, ResourcesModule];
Fronzy.setConfig(config).setModules(...modules).init();
Fronzy.setMainApp(App);

ReactDOM.render(
	<AppWrapper fronzy={Fronzy}/>,
	document.getElementById('app')
);
