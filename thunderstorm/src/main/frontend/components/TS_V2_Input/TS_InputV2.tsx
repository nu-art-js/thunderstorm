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
import {ComponentProps_Error, convertToHTMLDataAttributes, getErrorTooltip, resolveEditableError} from '../types';
import {TS_Object} from '@nu-art/ts-common';


type MetaKeys = 'shiftKey' | 'altKey' | 'ctrlKey' | 'metaKey';
type InputState = {
	id?: string,
	name?: string,
	initialValue?: string
	value?: string
}

export type InputType = 'text' | 'number' | 'password' | 'time';
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

type BaseAppLevelProps_TS_InputV2 =
	ComponentProps_Error
	& Omit<HTMLProps<HTMLInputElement>, 'onChange' | 'onBlur' | 'ref'>
	& BaseInfraProps_TS_InputV2
	& {
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
export type EditableItemProps_TS_InputV2<ValueType, K extends keyof T, T extends TS_Object & { [k in K]: ValueType } | ValueType[]> =
	Omit<BaseAppLevelProps_TS_InputV2, 'value'> & { value?: ValueType }
	& UIProps_EditableItem<T, K, ValueType>
	& { onChange?: (value: ValueType) => void, }

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

	static readonly editableTimeOptional = (templateProps: TemplatingProps_TS_InputV2) => {
		return <K extends string, T extends TS_Object & { [k in K]?: number | string }>(props: EditableItemProps_TS_InputV2<any, K, T>) => {
			return this._editableTime(templateProps)(props);
		};
	};

	static readonly editableTime = (templateProps: TemplatingProps_TS_InputV2) => {
		return <K extends string, T extends TS_Object & { [k in K]: number | string }>(props: EditableItemProps_TS_InputV2<any, K, T>) => {
			return this._editableTime(templateProps)(props);
		};
	};

	static readonly _editableTime = (templateProps: TemplatingProps_TS_InputV2) => {
		return <K extends string, T extends TS_Object & { [k in K]: number | string }>(props: EditableItemProps_TS_InputV2<number | string, K, T>) => {
			const {type, ...restTemplatingProps} = templateProps;
			const {editable, prop,shouldShowTooltip, saveEvent, ...rest} = props;
			const _saveEvents = [...saveEvent || [], ...templateProps.saveEvent || []];
			let onChange;
			let onBlur;
			let onAccept;

			const saveEventHandler = (value: string | number) => props.onChange ? props.onChange(value) : editable.updateObj({[prop]: value} as T);
			if (_saveEvents!.includes('change'))
				onChange = saveEventHandler;

			if (_saveEvents!.includes('blur'))
				onBlur = saveEventHandler;

			if (_saveEvents!.includes('accept'))
				onAccept = saveEventHandler;

			const value: string = props.editable.get(props.prop);
			return <TS_InputV2
				error={resolveEditableError(props)}
				{...restTemplatingProps} {...rest}
				type={type}
				onChange={onChange}
				shouldShowTooltip={shouldShowTooltip}
				onBlur={onBlur}
				onAccept={onAccept}
				value={String(props.value ?? value)}/>;
		};
	};

	static readonly editableNumberOptional = (templateProps: TemplatingProps_TS_InputV2) => {
		return <K extends string, T extends TS_Object & { [k in K]?: number }>(props: EditableItemProps_TS_InputV2<any, K, T>) => {
			// @ts-ignore
			return this._editableNumber(templateProps)(props);
		};
	};

	static readonly editableNumber = (templateProps: TemplatingProps_TS_InputV2) => {
		return <K extends string, T extends TS_Object & { [k in K]: number }>(props: EditableItemProps_TS_InputV2<any, K, T>) => {
			return this._editableNumber(templateProps)(props);
		};
	};
	static readonly _editableNumber = (templateProps: TemplatingProps_TS_InputV2) => {
		return <K extends string, T extends TS_Object & { [k in K]: number }>(props: EditableItemProps_TS_InputV2<number, K, T>) => {
			const {type, ...restTemplatingProps} = templateProps;
			const {editable, prop, saveEvent,shouldShowTooltip, ...rest} = props;
			const _saveEvents = [...saveEvent || [], ...templateProps.saveEvent || []];
			let onChange;
			let onBlur;
			let onAccept;

			const saveEventHandler = (value: string) => props.onChange ? props.onChange(+value) : editable.updateObj({[prop]: +value} as T);
			if (_saveEvents!.includes('change'))
				onChange = saveEventHandler;

			if (_saveEvents!.includes('blur'))
				onBlur = saveEventHandler;

			if (_saveEvents!.includes('accept'))
				onAccept = saveEventHandler;

			const value: string = props.editable.get(props.prop);
			return <TS_InputV2
				error={resolveEditableError(props)}
				{...restTemplatingProps} {...rest}
				type={type}
				shouldShowTooltip={shouldShowTooltip}
				onChange={onChange}
				onBlur={onBlur}
				onAccept={onAccept}
				value={String(props.value ?? value)}/>;
		};
	};

	static readonly editableOptional = (templateProps: TemplatingProps_TS_InputV2) => {
		return <K extends string, T extends TS_Object & ({ [k in K]?: string })>(props: EditableItemProps_TS_InputV2<string | undefined, K, T>) => {
			return this._editable(templateProps)(props);
		};
	};

	static readonly editableArray = (templateProps: TemplatingProps_TS_InputV2) => {
		return <K extends keyof T, T extends string[]>(props: EditableItemProps_TS_InputV2<string, K, T>) => {
			// @ts-ignore
			return this._editable(templateProps)(props);
		};
	};

	static readonly editable = (templateProps: TemplatingProps_TS_InputV2) => {
		return <K extends string, T extends TS_Object & ({ [k in K]: string })>(props: EditableItemProps_TS_InputV2<string, K, T>) => {
			// @ts-ignore
			return this._editable(templateProps)(props);
		};
	};

	static readonly _editable = (templateProps: TemplatingProps_TS_InputV2) => {
		return <K extends string, T extends TS_Object & ({ [k in K]?: string } | { [k in K]: string })>(props: EditableItemProps_TS_InputV2<string | undefined, K, T>) => {
			const {type, ...restTemplatingProps} = templateProps;
			const {editable, prop, saveEvent, ignoreError, shouldShowTooltip, ...rest} = props;
			const _saveEvents = [...saveEvent || [], ...templateProps.saveEvent || []];
			let onChange;
			let onBlur;
			let onAccept;

			const saveEventHandler = (value: string) => props.onChange ? props.onChange(value) : editable.updateObj({[prop]: value} as T);
			if (_saveEvents!.includes('change'))
				onChange = saveEventHandler;

			if (_saveEvents!.includes('blur'))
				onBlur = saveEventHandler;

			if (_saveEvents!.includes('accept'))
				onAccept = saveEventHandler;

			const value: string = props.editable.get(props.prop);
			return <TS_InputV2
				error={resolveEditableError(props)}
				{...restTemplatingProps} {...rest}
				type={type}
				onChange={onChange}
				onBlur={onBlur}
				onAccept={onAccept}
				shouldShowTooltip={shouldShowTooltip}
				value={props.value ?? value}/>;
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
		const {onAccept,shouldShowTooltip, error, trim, forceAcceptKeys, focus, saveEvent, ...props} = this.props;

		return <input
			{...props}
			{...convertToHTMLDataAttributes(this.props.error, 'error')}
			{...getErrorTooltip(this.props.error, this.props.shouldShowTooltip)}
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
