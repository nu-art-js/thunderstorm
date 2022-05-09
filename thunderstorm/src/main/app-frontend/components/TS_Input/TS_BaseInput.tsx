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
import {ChangeEvent, CSSProperties, HTMLProps, KeyboardEvent} from 'react';
import {Omit} from 'react-router';

export type InputType = 'text' | 'number' | 'password';

export type TS_BaseInputProps<Key, Element> = Omit<HTMLProps<Element>, 'onChange' | 'onBlur'> & {
	type: InputType
	style?: CSSProperties
	id?: Key
	onChange?: (value: string, id: Key) => void
	onAccept?: (value: string, event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void
	onCancel?: () => void
	onBlur?: (value: string, event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
	placeholder?: string
	enable?: boolean
	name?: string
	value?: string
	handleKeyEvent?: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void
	focus?: boolean
	spellCheck?: boolean
	autocomplete?: boolean
	innerRef?: React.RefObject<any>;
}

type InputState = {
	id: string,
	name?: string,
	initialValue?: string
	value?: string
}

export abstract class TS_BaseInput<Key extends string, Props extends TS_BaseInputProps<Key, Input>, Input = HTMLInputElement | HTMLTextAreaElement>
	extends React.Component<Props, InputState> {

	protected ref?: HTMLInputElement | HTMLTextAreaElement;

	constructor(props: Props) {
		super(props);

		this.state = TS_BaseInput.getInitialState(props);
	}

	static getDerivedStateFromProps(props: TS_BaseInputProps<any, any>, state: InputState) {
		if (props.id === state.id && state.name === props.name && state.initialValue === props.value)
			return {value: state.value};

		return TS_BaseInput.getInitialState(props);
	}

	private static getInitialState(props: TS_BaseInputProps<any, any>) {
		return {
			id: props.id,
			name: props.name,
			initialValue: props.value,
			value: props.value || ''
		};
	}

	changeValue = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const value = event.target.value;
		this.setState({value});
		this.props.onChange?.(value, event.target.id as Key);
	};

	handleKeyEvent = (ev: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		if (this.props.onAccept && ev.key === 'Enter' && !ev.shiftKey && !ev.altKey && !ev.ctrlKey && !ev.metaKey) {
			const value = ev.currentTarget.value;

			this.props.onAccept(value, ev);
			ev.stopPropagation();
		}

		if (this.props.onCancel && ev.key === 'Escape' && !ev.shiftKey && !ev.altKey && !ev.ctrlKey && !ev.metaKey) {
			this.props.onCancel();
			ev.stopPropagation();
		}
	};
}