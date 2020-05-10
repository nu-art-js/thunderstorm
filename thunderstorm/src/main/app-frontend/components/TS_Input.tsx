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
import {KeyboardEvent} from 'react';

type Props<Key> = {
	onChange: (value: string, id: Key) => void
	onAccept?: () => void
	inputClassName?: string,
	style?: React.CSSProperties
	value?: string
	error?: string
	type: 'text' | 'number' | 'password'
	placeholder?: string
	id?: Key
	focus?: boolean
}

type State = { value: string }

export class TS_Input<Key extends string>
	extends React.Component<Props<Key>, State> {
	constructor(props: Props<Key>) {
		super(props);

		this.state = {value: props.value || ""};
	}

	changeValue = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		this.setState({value: value});
		this.props.onChange(value, event.target.id as Key)
	};

	handleKeyPress = (event: KeyboardEvent) => {
		if (!this.props.onAccept)
			return;

		if (event.which === 13)
			this.props.onAccept();
	};

	render() {
		const {id, type, placeholder, style, inputClassName} = this.props;
		return (<input
			className={inputClassName}
			style={{...style}}
			key={id}
			id={id}
			type={type}
			value={this.state.value}
			placeholder={placeholder}
			onChange={this.changeValue}
			onKeyPress={this.handleKeyPress}
			ref={input => this.props.focus && input && input.focus()}
		/>);
	}

}