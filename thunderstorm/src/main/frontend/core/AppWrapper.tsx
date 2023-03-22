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
import {BrowserRouter} from 'react-router-dom';
import {Thunder} from './Thunder';
import {ImplementationMissingException} from '@nu-art/ts-common';
import {createRoot} from 'react-dom/client';
import {Router} from 'react-router-dom';

export function renderApp() {
	const mainApp = Thunder.getInstance().getMainApp();
	const routes = Thunder.getInstance().getRoutes();
	if (!mainApp && !routes)
		throw new ImplementationMissingException('One must be defined: MainApp, Routes');

	//Create DOM root
	const root = document.createElement('div');
	root.setAttribute('id', 'root');
	root.setAttribute('class', 'match_parent');
	document.body.appendChild(root);

	//Connect React Root
	const appRoot = createRoot(root);

	const MainApp = mainApp as React.ElementType<{}>;
	appRoot.render(<Router><MainApp/></Router>);

	if (routes) {
		console.log('Rendering Routes');
		const Routes = routes as React.ElementType<{}>;
		appRoot.render(<BrowserRouter><Routes/></BrowserRouter>);
	} else {
		console.log('Rendering Main App');
		appRoot.render(<MainApp/>);
	}
}