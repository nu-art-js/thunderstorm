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
import {Example_NewProps, TS_FilterInput, Props_FilterInput} from "@nu-art/thunderstorm/frontend";
import {__stringify} from "@nu-art/ts-common";

export class Example_FilterInput
	extends React.Component<{}, { filteredOptions: any[] }> {

	constructor(props: {}) {
		super(props);
		this.state = {filteredOptions: []}
	}

	render() {
		const props1 = this.simpleStringProps();
		const props2 = this.simpleObjectProps();
		return <>
			<Example_NewProps name={"Filter Input"} renderer={TS_FilterInput} data={[props1, props2]} showList={false}/>
			<div>
				{this.state.filteredOptions.map((item, index) => <div key={index}>{__stringify(item)}</div>)}
			</div>
		</>
	}

	private simpleStringProps() {
		const list = ["abcde", "cdefg", "efghi", "ghijk"];
		return {
			key: "simple-string-input",
			id: "simple-string-input",
			filter: (item: string) => [item],
			list,
			onChange: (filteredOptions: string[], filter: string, id?: string) => {
				console.log(`id: ${id}\nfilter: ${filter}\n items: ${__stringify(filteredOptions)}`)
				this.setState({filteredOptions})
			},
			placeholder: "simple string",
			focus: true,
			style: {border: "solid 1px red"}
		} as Props_FilterInput<any>;
	}

	private simpleObjectProps() {
		const list = [
			{label: "abcde"},
			{label: "cdefg"},
			{label: "efghi"},
			{label: "ghijk"}
		];
		return {
			key: "simple-object-input",
			id: "simple-object-input",
			filter: (item: { label: string }) => [item.label],
			list,
			onChange: (filteredOptions: { label: string }[], filter: string, id?: string) => {
				console.log(`id: ${id}\nfilter: ${filter}\n items: ${__stringify(filteredOptions)}`)
				this.setState({filteredOptions})
			},
			focus: true,
			placeholder: "simple object",
			style: {border: "solid 1px gray"}
		} as Props_FilterInput<any>;
	}
}
