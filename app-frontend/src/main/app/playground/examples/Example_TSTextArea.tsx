/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
 *
 * Copyright (C) 2020 Intuition Robotics
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
	TS_TextAreaProps,
	TS_TextArea
} from "@ir/thunderstorm/frontend";

type TestType = {
	prop1?: string,
	prop2?: string,
	prop3?: string,
	prop4?: string,
}

export class Example_TSTextArea
	extends React.Component<{}, { instance: TestType }> {

	constructor(props: {}) {
		super(props);
		this.state = {instance: {}}
	}

	render() {
		const props1 = this.props1();
		const props2 = this.props2();
		return <>
			<Example_NewProps name={"TS Input"} renderer={TS_TextArea} data={[props1, props2]}/>
		</>
	}

	private props1(): TS_TextAreaProps<any> {
		const placeholder = "prop1";
		const prop: TS_TextAreaProps<"prop1"> = {
			type: "text",
			id: "prop1",
			name: placeholder,
			placeholder: placeholder,
			value: this.state.instance["prop1"],
			onChange: (value: string, id: "prop1") => {
				this.setState(state => ({
					instance: {...state.instance, [id]: value}
				}))
			}
		};
		return prop;
	}

	private props2(): TS_TextAreaProps<any> {
		const placeholder = "prop2";
		const prop: TS_TextAreaProps<"prop2"> = {
			type: "text",
			id: "prop2",
			name: placeholder,
			placeholder: placeholder,
			value: this.state.instance["prop2"],
			onChange: (value: string, id: "prop2") => {
				this.setState(state => ({
					instance: {...state.instance, [id]: value}
				}))
			}
		};
		return prop;
	}
}
