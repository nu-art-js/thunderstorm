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
import {ExampleModule, RequestKey_GetApi, RequestKey_PostApi,} from '@modules/ExampleModule';
import {ComponentSync, ModuleFE_ForceUpgrade} from '@thunder-storm/core/frontend';
import {LiveDoc} from '@thunder-storm/live-docs/frontend';
import {AdminBR} from '@thunder-storm/bug-report/frontend';
import {OnRequestListener} from '@thunder-storm/core';

export class Hello_Renderer
	extends ComponentSync<{}, { label: string }>
	implements OnRequestListener {

	protected deriveStateFromProps(nextProps: {}): { label: string; } {
		return {label: this.state?.label};
	}

	constructor(props: any) {
		super(props);
		this.state = {
			label: 'Hello World'
		};
	}

	render() {
		return <>
			<div className="ll_h_c"><h1 onClick={ExampleModule.getMessageFromServer1}>{this.state.label}</h1><LiveDoc docKey="one-mouse-click"/></div>
			<div className="ll_h_c"><h1 onClick={() => console.log('onclick')} onDoubleClick={ExampleModule.getMessageFromServer2}>Double click me</h1><LiveDoc
				docKey="double-mouse-click"/></div>
			<div className="ll_h_c"><h1 onClick={() => console.log('onClick')} onDoubleClick={() => console.log('onDoubleClick')}>Click OR Double Click</h1></div>
			<div className="ll_h_c"><h1 onClick={ModuleFE_ForceUpgrade.compareVersion}>Assert version</h1><LiveDoc docKey="assert-version"/></div>
			<div>
				<AdminBR/>
			</div>
		</>;
	}

	__onRequestCompleted = (key: string, success: boolean) => {
		if (!success)
			return;

		switch (key) {
			default:
				return;

			case RequestKey_GetApi:
			case RequestKey_PostApi:
				this.setState({label: ExampleModule.getMessage()});
		}
	};
}

export const Hello = {renderer: Hello_Renderer, name: 'Hello'};