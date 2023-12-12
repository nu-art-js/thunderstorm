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
import {_className} from '../../utils/tools';
import './TS_InputV2.scss';
import {UIProps_EditableItem} from '../../utils/EditableItem';


type MetaKeys = 'shiftKey' | 'altKey' | 'ctrlKey' | 'metaKey';
type InputState = {
	id?: string,
	name?: string,
	initialValue?: string
	value?: string
}

export type InputType = 'text' | 'number' | 'password';
type TypeProps_TS_Input = {
	type: InputType
}

type BaseInfraProps_TS_InputV2 = {
	saveEvent?: ('blur' | 'accept' | 'change')[]
	forceAcceptKeys?: MetaKeys[]

	className?: string
	style?: CSSProperties
	trim?: boolean,
	autoComplete?: string
	spellCheck?: boolean
}

type BaseAppLevelProps_TS_InputV2 = Omit<HTMLProps<HTMLInputElement>, 'onChange' | 'onBlur' | 'ref'> & BaseInfraProps_TS_InputV2 & {
	id?: string
	placeholder?: string
	name?: string
	focus?: boolean
	innerRef?: React.RefObject<HTMLInputElement>;
	onCancel?: () => void
}

export type TemplatingProps_TS_InputV2 = TypeProps_TS_Input & BaseInfraProps_TS_InputV2

export type Props_TS_InputV2 = BaseAppLevelProps_TS_InputV2 & TypeProps_TS_Input & {
	value?: string
	onChange?: (value: string, id: string) => void
	onAccept?: (value: string, event: KeyboardEvent<HTMLInputElement>) => void
	onBlur?: (value: string, event: React.FocusEvent<HTMLInputElement>) => void
}

export type NativeProps_TS_InputV2 = Props_TS_InputV2
export type EditableItemProps_TS_InputV2 = BaseAppLevelProps_TS_InputV2 & UIProps_EditableItem<any, any, string>

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

	static readonly editableString = (mandatoryProps: TemplatingProps_TS_InputV2) => {
		return (props: NativeProps_TS_InputV2) => <TS_InputV2 {...mandatoryProps} {...props}/>;
	};

	static readonly editable = (mandatoryProps: TemplatingProps_TS_InputV2) => {
		return (props: EditableItemProps_TS_InputV2) => {
			const {type, ...restTemplatingProps} = mandatoryProps;
			const {editable, prop, saveEvent, ...rest} = props;
			let onChange;
			let onBlur;
			let onAccept;
			if (saveEvent!.includes('change'))
				onChange = (value: string) => editable.updateObj({[prop]: value});

			if (saveEvent!.includes('blur'))
				onBlur = (value: string) => editable.updateObj({[prop]: value});

			if (saveEvent!.includes('accept'))
				onAccept = (value: string) => editable.updateObj({[prop]: value});

			return <TS_InputV2
				{...restTemplatingProps} {...rest}
				type={type}
				onChange={onChange}
				onBlur={onBlur}
				onAccept={onAccept}
				value={props.editable.item[props.prop]}/>;
		};

	};

	static defaultProps = {
		forceAcceptKeys: ['ctrlKey', 'metaKey'] as MetaKeys[],
		saveEvent: ['accept']
	};

	protected ref?: HTMLInputElement;

	constructor(props: Props_TS_InputV2) {
		super(props);

		this.state = TS_InputV2.getInitialState(props);
	}

	static getDerivedStateFromProps(props: Props_TS_InputV2, state: InputState) {
		if (props.id === state.id && state.name === props.name && state.initialValue === props.value)
			return {value: state.value};

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

	onKeyDown = (ev: KeyboardEvent<HTMLInputElement>) => {
		let value = ev.currentTarget.value;
		if (!(ev.shiftKey || ev.altKey || ev.ctrlKey || ev.metaKey)) {
			if (ev.key === 'Enter') {
				ev.persist();
				if (this.props.trim)
					value = value.trim();

				//@ts-ignore - despite what typescript says, ev.target does have a blur function.
				ev.target.blur();

				if (this.props.onAccept) {
					if (value !== this.props.value)
						this.props.onAccept(value, ev);
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
				if (value !== this.props.value)
					this.props.onAccept(value, ev);
				ev.stopPropagation();
			}

		this.props.onKeyDown?.(ev);
	};

	render() {
		const {onAccept, trim, forceAcceptKeys, focus, saveEvent, ...props} = this.props;

		return <input
			{...props}
			autoFocus={focus}
			ref={props.innerRef}
			onBlur={(event) => {
				const value = event.target.value;
				this.setState({value});
				props.onBlur?.(value, event);
			}}
			name={props.name || props.id}
			className={_className('ts-input', props.className)}
			value={this.state.value}
			onChange={this.changeValue}
			onKeyDown={this.onKeyDown}
			autoComplete={props.autoComplete ? 'on' : 'off'}
		/>;
	}
}
