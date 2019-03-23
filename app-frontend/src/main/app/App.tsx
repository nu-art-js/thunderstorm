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
import {Route, Switch} from 'react-router';
import {DragEvent} from "react";
import {Page_Home} from "./pages/Page_Home";
import {WrapperProps} from "@nu-art/fronzy";

export class App
	extends React.Component<WrapperProps> {

	public static dropBlocker<T>(ev: DragEvent<T>) {
		ev.preventDefault();
		ev.stopPropagation();
	};

	render() {
		return (
			<div onDrop={App.dropBlocker} onDragOver={App.dropBlocker}>
				<Switch>
					<Route exact path="/" component={Page_Home}/>
					<Route path="/test" component={Page_Home}/>
					<Route component={Page_Home}/>
				</Switch>
			</div>);
	}
}