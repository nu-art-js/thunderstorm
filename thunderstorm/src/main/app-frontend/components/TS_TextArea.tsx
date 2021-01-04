/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
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

import * as React from 'react';
import {KeyboardEvent} from 'react';
import {Stylable} from "../tools/Stylable";

export type TS_TextAreaProps<Key> = Stylable & {
	onChange?: (value: string, id: Key) => void
	onAccept?: () => void
	type: 'text' | 'number' | 'password'
	name?: string

	value?: string
	error?: string
	placeholder?: string
	enable?: boolean
	id?: Key
}

type State = {
	id: string,
	name?: string,
	initialValue?: string
	value?: string
}

export class TS_TextArea<Key extends string>
	extends React.Component<TS_TextAreaProps<Key>, State> {

	constructor(props: TS_TextAreaProps<Key>) {
		super(props);

		this.state = TS_TextArea.getInitialState(props);
	}

	private static getInitialState(props: TS_TextAreaProps<any>) {
		return {
			id: props.id,
			name: props.name,
			initialValue: props.value,
			value: props.value || ""
		};
	}

	static getDerivedStateFromProps(props: TS_TextAreaProps<any>, state: State) {
		if (props.id === state.id && state.name === props.name && state.initialValue === props.value)
			return {value: state.value};

		return TS_TextArea.getInitialState(props);
	}


	changeValue = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const value = event.target.value;
		this.setState({value});
		this.props.onChange?.(value, event.target.id as Key);
	};

	handleKeyPress = (event: KeyboardEvent) => {
		if (!this.props.onAccept)
			return;

		if (event.key === "Escape")
			this.props.onAccept();
	};

	render() {
		const {id, placeholder, style} = this.props;
		return <textarea
			disabled={this.props.enable === false}
			key={id}
			id={id}
			onKeyPress={this.handleKeyPress}
			onChange={this.changeValue}
			value={this.state.value}
			placeholder={placeholder}
			style={{...style}}
		/>;
	}

}

