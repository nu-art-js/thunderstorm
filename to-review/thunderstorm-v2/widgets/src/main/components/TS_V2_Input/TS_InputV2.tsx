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
import {_className} from '@nu-art/thunder-core';
import '../TS_Input/TS_Input.scss';
import {ComponentProps_Error, convertToHTMLDataAttributes, getErrorTooltip} from '../types.js';

type MetaKeys = 'shiftKey' | 'altKey' | 'ctrlKey' | 'metaKey';
type InputState = {
	id?: string;
	name?: string;
	initialValue?: string;
	value?: string;
	focused?: boolean;
};
export type InputType = 'text' | 'number' | 'password' | 'time';
type TypeProps_TS_Input = {
	type: InputType;
};
type BaseInfraProps_TS_InputV2 = {
	saveEvent?: ('blur' | 'accept' | 'change')[];
	forceAcceptKeys?: MetaKeys[];
	className?: string;
	style?: CSSProperties;
	trim?: boolean;
	autoComplete?: string;
	spellCheck?: boolean;
};
export type BaseAppLevelProps_TS_InputV2 =
	ComponentProps_Error
	& Omit<HTMLProps<HTMLInputElement>, 'onChange' | 'onBlur' | 'ref'>
	& BaseInfraProps_TS_InputV2
	& {
	id?: string;
	placeholder?: string;
	name?: string;
	focus?: boolean;
	innerRef?: React.RefObject<HTMLInputElement>;
	onCancel?: () => void;
};
export type TemplatingProps_TS_InputV2 = TypeProps_TS_Input & BaseInfraProps_TS_InputV2;
export type Props_TS_InputV2 = BaseAppLevelProps_TS_InputV2 & TypeProps_TS_Input & {
	value?: string;
	onChange?: (value: string, id: string) => void;
	onAccept?: (value: string, event: KeyboardEvent<HTMLInputElement>) => Promise<any> | any;
	onBlur?: (value: string, event: React.FocusEvent<HTMLInputElement>) => void;
	allowAccept?: boolean;
};
export type NativeProps_TS_InputV2 = Props_TS_InputV2;

/**
 * A better way to capture user input
 *
 * <code>
 * 		<input className="ts-input"/>
 * </code>
 *
 */
export class TS_InputV2
	extends React.Component<Props_TS_InputV2, InputState> {
	static readonly editableString = (templateProps: TemplatingProps_TS_InputV2) => {
		return (props: NativeProps_TS_InputV2) => <TS_InputV2 {...templateProps} {...props}/>;
	};
	static defaultProps = {
		forceAcceptKeys: ['ctrlKey', 'metaKey'] as MetaKeys[],
		saveEvent: ['accept']
	};
	inputRef: React.RefObject<HTMLInputElement>;

	constructor(props: Props_TS_InputV2) {
		super(props);
		this.inputRef = React.createRef();
		this.state = TS_InputV2.getInitialState(props);
	}

	static getDerivedStateFromProps(props: Props_TS_InputV2, state: InputState) {
		if (props.id === state.id && state.name === props.name && state.initialValue === props.value)
			return {value: state.value, focused: state.focused};
		return TS_InputV2.getInitialState(props);
	}

	private static getInitialState(props: Props_TS_InputV2) {
		return {
			id: props.id,
			name: props.name,
			initialValue: props.value,
			value: props.value || ''
		};
	}

	changeValue = (event: ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		this.setState({value});
		this.props.onChange?.(value, event.target.id);
	};
	onKeyDown = async (ev: KeyboardEvent<HTMLInputElement>) => {
		let value = ev.currentTarget.value;
		if (!(ev.shiftKey || ev.altKey || ev.ctrlKey || ev.metaKey)) {
			if (ev.key === 'Enter') {
				ev.persist();
				if (this.props.trim)
					value = value.trim();
				//@ts-ignore - despite what typescript says, ev.target does have a blur function.
				ev.target.blur();
				if (this.props.onAccept) {
					if (value !== this.props.value || this.props.allowAccept) {
						await this.props.onAccept(value, ev);
					}
					ev.stopPropagation();
				}
			}
			if (ev.key === 'Escape' && this.props.onCancel) {
				this.props.onCancel();
				ev.stopPropagation();
			}
		}
		if (ev.key === 'Enter' && this.props.forceAcceptKeys?.find(key => ev[key]))
			if (this.props.onAccept) {
				if (value !== this.props.value || this.props.allowAccept) {
					await this.props.onAccept(value, ev);
				}
				ev.stopPropagation();
			}
		this.props.onKeyDown?.(ev);
	};

	componentDidMount() {
		// console.log(`REFOCUS!!!`);
		if (!this.inputRef.current)
			return console.log(`CAN'T REFOCUS!!! - no REF: ${this.state.value}`);
		// if (this.props.innerRef) {
		// 	// @ts-ignore
		// 	this.props.innerRef.current = ref;
		// }
		if (this.state.focused) {
			console.log(`REFOCUS!!! - value: ${this.state.value}`);
			this.inputRef.current.focus();
		}
	}

	render() {
		const {onAccept, allowAccept, showErrorTooltip, error, trim, forceAcceptKeys, focus, saveEvent, ...props} = this.props;
		return <input {...props} {...convertToHTMLDataAttributes(this.props.error, 'error')} {...getErrorTooltip(this.props.error, this.props.showErrorTooltip)}
									autoFocus={focus} ref={this.inputRef} onBlur={(event) => {
			const value = event.target.value;
			this.setState({value, focused: false});
			props.onBlur?.(value, event);
		}} onFocus={(event) => {
			this.setState({focused: true});
		}} name={props.name || props.id} className={_className('ts-input', props.className)} value={this.state.value} onChange={this.changeValue}
									onKeyDown={this.onKeyDown} autoComplete={props.autoComplete ? 'on' : 'off'}/>;
	}
}
