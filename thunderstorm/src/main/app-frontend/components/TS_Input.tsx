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

type Props<Key> = {
	onChange: (value: string, id: Key) => void
	onAccept?: () => void
	onCancel?: () => void
	onBlur?: () => void
	handleKeyEvent?: (e: KeyboardEvent) => void
	className?: string
	style?: React.CSSProperties
	value?: string
	error?: string
	type: 'text' | 'number' | 'password'
	placeholder?: string
	id?: Key
	focus?: boolean
	spellCheck?: boolean
}

type State = { value: string }

export class TS_Input<Key extends string>
	extends React.Component<Props<Key>, State> {
	private ref?: HTMLInputElement | null;

	constructor(props: Props<Key>) {
		super(props);

		this.state = {value: props.value || ""};
	};

	private handleKeyEvent = (ev: KeyboardEvent) => {
		if (this.props.onAccept && ev.which === 13)
			this.props.onAccept();

		if (this.props.onCancel && ev.which === 27)
			this.props.onCancel();

		ev.stopPropagation();
	};

	private onDoubleClick(ev: React.MouseEvent) {
		if (!this.ref || !this.props.focus)
			return;

		this.ref.select();
		ev.stopPropagation();
	}

	changeValue = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		this.setState({value: value});
		this.props.onChange(value, event.target.id as Key)
	};

	render() {
		const {id, type, placeholder, style, className, spellCheck, focus, onBlur} = this.props;
		const handleKeyEvent = this.props.handleKeyEvent || this.handleKeyEvent;
		return <input
			className={className}
			style={{...style}}
			key={id}
			id={id}
			type={type}
			onDoubleClick={this.onDoubleClick}
			value={this.state.value}
			placeholder={placeholder}
			onChange={this.changeValue}
			onBlur={() => {
				this.ref?.removeEventListener('keydown', handleKeyEvent);
				this.ref = null;
				onBlur && onBlur();
			}}
			ref={input => {
				if (this.ref || !input)
					return;

				this.ref = input;
				focus && this.ref.focus();
				this.ref.addEventListener('keydown', handleKeyEvent);
			}}
			spellCheck={spellCheck}
		/>;
	}
}