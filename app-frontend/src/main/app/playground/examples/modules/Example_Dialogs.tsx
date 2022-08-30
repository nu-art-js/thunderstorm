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
import {ModuleFE_Toaster} from '@nu-art/thunderstorm/frontend';


class Example_Dialogs_Renderer
	extends React.Component {
	constructor(props: {}) {
		super(props);

		this.state = {
			formFields: {},
		};
	}

	showAppToasterSuccessExample = () => {
		ModuleFE_Toaster.toastSuccess('Simple success message');
	};

	showAppToasterErrorExample = () => {
		ModuleFE_Toaster.toastError('Simple error message');
	};

	showAppToasterInfoExample = () => {
		ModuleFE_Toaster.toastInfo('Simple info message');
	};

	render() {
		return <>
			<button style={{marginRight: 8}} onClick={this.showAppToasterSuccessExample}>Toaster Default Success Example</button>
			<button style={{marginRight: 8}} onClick={this.showAppToasterErrorExample}>Toaster Default Failure Example</button>
			<button style={{marginRight: 8}} onClick={this.showAppToasterInfoExample}>Toaster Default Info Example</button>
		</>;
	}
}

export const Example_Dialogs = {renderer: Example_Dialogs_Renderer, name: 'Dialog Examples'};