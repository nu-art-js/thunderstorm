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

import * as React from 'react';
import {ExampleModule} from '@modules/ExampleModule';

class Example_ApiCustomError_Renderer
	extends React.Component {

	constructor(props: {}) {
		super(props);

		this.state = {
			formFields: {},
		};
	}

	callServerApi_CustomError = () => {
		ExampleModule.callCustomErrorApi();
	};

	render() {
		return <>
			<button style={{marginRight: 8}} onClick={this.callServerApi_CustomError}>Server API - Custom Error</button>
		</>;
	}
}

export const Example_ApiCustomError = {renderer: Example_ApiCustomError_Renderer, name: 'Custom error'};