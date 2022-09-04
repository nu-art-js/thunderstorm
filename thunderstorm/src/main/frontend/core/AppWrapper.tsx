/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
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

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Router} from 'react-router-dom';
import {ModuleFE_BrowserHistory} from '../modules/ModuleFE_BrowserHistory';
import {Thunder} from './Thunder';
import {ImplementationMissingException} from '@nu-art/ts-common';


export function renderApp() {
	const MainApp = Thunder.getInstance().getMainApp();
	if (!MainApp)
		throw new ImplementationMissingException('mainApp was not specified!!');

	const appDiv = document.createElement('div');
	appDiv.classList.add('match_height');
	document.body.appendChild(appDiv);

	const history = ModuleFE_BrowserHistory.getHistory();
	const appJsx = <Router history={history}><MainApp/></Router>;
	ReactDOM.render(
		appJsx,
		appDiv
	);
}
