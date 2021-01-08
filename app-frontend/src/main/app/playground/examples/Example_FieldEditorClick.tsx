/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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

import * as React from "react";
import {
	Example_NewProps,
	FieldEditorClick,
	FieldEditorClickProps
} from "@nu-art/thunderstorm/frontend";

type TestType = {
	prop1?: string,
	prop2?: string,
}

export class Example_FieldEditorClick
	extends React.Component<{}, { instance: TestType }> {

	constructor(props: {}) {
		super(props);
		this.state = {
			instance: {
				prop1: 'I start with 1',
				prop2: 'I start with 2'
			}
		};
	}

	render() {
		const props1 = this.props1();
		const props2 = this.props2();
		return <>
			<Example_NewProps name={"Field Editor Click"} renderer={FieldEditorClick} data={[props1, props2]}/>
		</>;
	}

	private props1(): FieldEditorClickProps {
		return {
			id: "prop1",
			onAccept: (value: string) => {
				this.setState(state => ({
					instance: {...state.instance, ['prop1']: value}
				}));
			},
			labelStyle: {height: 20, width: 170},
			value: this.state.instance.prop1
		};
	}

	private props2(): FieldEditorClickProps {
		return {
			id: "prop2",
			onAccept: (value: string) => {
				this.setState(state => ({
					instance: {...state.instance, ['prop2']: value}
				}));
			},
			labelStyle: {height: 20, width: 170},
			value: this.state.instance.prop2
		};
	}
}
