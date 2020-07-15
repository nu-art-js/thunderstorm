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

import * as React from "react";
import {Component} from "react";
import {
	Adapter,
	AdapterBuilder,
	ToastModule,
	Tree,
	TS_Input
} from "@nu-art/thunderstorm/frontend";
import {__stringify} from "@nu-art/ts-common";

type Keys = 'first' | 'second'

type Type = {
	placeHolder: string
	value: Keys
};

type State = {
 [K in Keys]: string
}

export class Example_List_WithInput
	extends Component<{}, State> {
	private readonly data: Type[];

	constructor(props: {}) {
		super(props);
		this.state = {first: '', second: ''};
		this.data = [{
			placeHolder: 'Choose...',
			value: 'first',
		}, {
			placeHolder: 'Choose also...',
			value: 'second',
		}]
		;
	}

	render() {
		const adapter: Adapter = AdapterBuilder()
			.list()
			.singleRender((props: { item: Type }) => {
				if (typeof props.item !== 'object')
					return null;

				return <div><TS_Input type={"text"} focus={true} placeholder={props.item.placeHolder} value={this.state[props.item.value]} onChange={value => {
					const key: "first" | "second" = props.item.value;
					// @ts-ignore
					this.setState({[key]: value});
					return console.log(value);
				}}
				/>
					<div>{props.item.value}</div>
				</div>;
			})
			.setData(this.data)
			.build();

		return <div>
			<div>
				<h2>Here is a tree with one renderer Type</h2>
				<Tree
					adapter={adapter}
					onNodeClicked={(path: string, item: any) => ToastModule.toastInfo(`clicked on ${path}: ${__stringify(item)}`)}/>
			</div>
		</div>
	}
}


