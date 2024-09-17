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
import './TS_TextAreaV2.scss';
import {UIProps_EditableItem} from '../../utils/EditableItem';
import {
	ComponentProps_Error,
	convertToHTMLDataAttributes,
	resolveEditableError
} from '../types';
import {getComputedStyleProperty} from '../utils';


type MetaKeys = 'shiftKey' | 'altKey' | 'ctrlKey' | 'metaKey';
type InputState = {
	id?: string,
	name?: string,
	initialValue?: string
	value?: string
}

type BaseInfraProps_TS_TextAreaV2 = {
	saveEvent?: ('blur' | 'accept' | 'change')[]
	forceAcceptKeys?: MetaKeys[]
	className?: string
	style?: CSSProperties
	resizeWithText?: boolean;
	trim?: boolean,
	autoComplete?: string
	spellCheck?: boolean
}

type BaseAppLevelProps_TS_TextAreaV2 =
	ComponentProps_Error
	& Omit<HTMLProps<HTMLTextAreaElement>, 'onChange' | 'onBlur' | 'ref'>
	& BaseInfraProps_TS_TextAreaV2
	& {
	id?: string
	placeholder?: string
	name?: string
	focus?: boolean
	innerRef?: React.RefObject<HTMLTextAreaElement>;
	onCancel?: () => void
}

export type TemplatingProps_TS_TextAreaV2 = BaseInfraProps_TS_TextAreaV2

export type Props_TS_TextAreaV2 = BaseAppLevelProps_TS_TextAreaV2 & {
	value?: string
	onChange?: (value: string, id: string) => void
	onAccept?: (value: string, event: KeyboardEvent<HTMLTextAreaElement>) => void
	onBlur?: (value: string, event: React.FocusEvent<HTMLTextAreaElement>) => void
}

export type NativeProps_TS_TextAreaV2 = Props_TS_TextAreaV2
export type EditableItemProps_TS_TextAreaV2 = BaseAppLevelProps_TS_TextAreaV2
	& UIProps_EditableItem<any, any, string>
	& { onChange?: (value: string) => void, }

/**
 * A better way to capture user input
 *
 * <code>
 * 		<input className="ts-input"/>
 * </code>
 *
 */
export class TS_TextAreaV2
	extends React.Component<Props_TS_TextAreaV2, InputState> {

	static readonly editableString = (mandatoryProps: TemplatingProps_TS_TextAreaV2) => {
		return (props: NativeProps_TS_TextAreaV2) => <TS_TextAreaV2 {...mandatoryProps} {...props}/>;
	};

	static readonly editable = (templateProps: TemplatingProps_TS_TextAreaV2) => {
		return (props: EditableItemProps_TS_TextAreaV2) => {
			const {editable, prop, saveEvent, ...rest} = props;
			const _saveEvents = [...saveEvent || [], ...templateProps.saveEvent || []];
			let onChange;
			let onBlur;
			let onAccept;

			const saveEventHandler = (value: string) => {
				return props.onChange ? props.onChange(value) : editable.updateObj({[prop]: value});
			};

			if (_saveEvents!.includes('change'))
				onChange = saveEventHandler;

			if (_saveEvents!.includes('blur'))
				onBlur = saveEventHandler;

			if (_saveEvents!.includes('accept'))
				onAccept = saveEventHandler;

			return <TS_TextAreaV2
				{...templateProps}
				{...rest}
				error={resolveEditableError(props)}
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

	protected ref?: HTMLTextAreaElement;

	constructor(props: Props_TS_TextAreaV2) {
		super(props);

		this.state = TS_TextAreaV2.getInitialState(props);
	}

	static getDerivedStateFromProps(props: Props_TS_TextAreaV2, state: InputState) {
		if (props.id === state.id && state.name === props.name && state.initialValue === props.value)
			return {value: state.value};

		return TS_TextAreaV2.getInitialState(props);
	}

	private static getInitialState(props: Props_TS_TextAreaV2) {
		return {
			id: props.id,
			name: props.name,
			initialValue: props.value,
			value: props.value || ''
		};
	}

	changeValue = (event: ChangeEvent<HTMLTextAreaElement>) => {
		const value = event.target.value;
		this.setState({value});
		this.props.onChange?.(value, event.target.id);

		if (this.props.resizeWithText)
			this.resizeWithText();
	};

	onKeyDown = (ev: KeyboardEvent<HTMLTextAreaElement>) => {
		let value = ev.currentTarget.value;
		const textarea = ev.currentTarget;

		if (ev.key === 'Escape' && this.props.onCancel) {
			this.props.onCancel();
			ev.stopPropagation();
		}

		if (ev.shiftKey || ev.altKey) {
			if (ev.key === 'Enter') {
				ev.preventDefault(); // Prevent default behavior of Enter

				let cursorPos = value.indexOf('\n', textarea.selectionStart);
				if (cursorPos === -1)
					cursorPos = value.length;

				const beforeCursor = value.substring(0, cursorPos);
				const afterCursor = value.substring(cursorPos);

				// Insert a new line at the current cursor position
				textarea.value = beforeCursor + '\n' + afterCursor;

				// Set the cursor position after the inserted new line
				textarea.selectionStart = textarea.selectionEnd = cursorPos + 1;
				if (this.props.resizeWithText)
					this.resizeWithText();
			}
		}

		if (ev.ctrlKey || ev.metaKey) {
			if (ev.key === 'Enter') {
				//@ts-ignore - despite what typescript says, ev.target does have a blur function.
				ev.target.blur();
				if (this.props.trim)
					value = value.trim();

				if (this.props.onAccept) {
					if (value !== this.props.value)
						this.props.onAccept(value, ev);
					ev.stopPropagation();
				}
			}
			return;
		}

		// I assume we need to persist this even if we call an external callback
		ev.persist();
		this.props.onKeyDown?.(ev);
	};

	resizeWithText = () => {
		const el = this.ref as HTMLTextAreaElement;
		if (!el)
			return;

		const currentHeight = el.offsetHeight;

		if (el.scrollHeight > currentHeight) { //Can increase height
			const newHeight = el.scrollHeight + 5;
			el.style.height = `${newHeight}px`;
		} else { //Check if height needs to be decreased
			const borderWidthTop = Number(getComputedStyleProperty(el, 'border-top-width')?.replace('px', ''));
			const borderWidthBottom = Number(getComputedStyleProperty(el, 'border-bottom-width')?.replace('px', ''));
			const borderWidth = borderWidthTop + borderWidthBottom;
			el.style.height = '1px';
			const scrollHeight = el.scrollHeight;
			const heightDiff = currentHeight - scrollHeight;
			const newHeight = heightDiff <= borderWidth + 1 ? currentHeight : scrollHeight + borderWidth + 1;
			el.style.height = `${newHeight}px`;
		}
	};

	render() {
		const {onAccept, error, trim, saveEvent, forceAcceptKeys, focus, innerRef, resizeWithText, ...props} = this.props;

		return <textarea
			{...props}
			{...convertToHTMLDataAttributes(this.props.error, 'error')}
			ref={input => {
				if (this.ref || !input)
					return;

				this.ref = input;
				if (innerRef) {
					// @ts-ignore
					innerRef.current = input;
				}

				if (this.props.resizeWithText)
					this.resizeWithText();

				this.props.focus && this.ref.focus();
			}}
			autoFocus={focus}
			onBlur={(event) => {
				const value = event.target.value;
				this.setState({value});
				props.onBlur?.(value, event);
			}}
			name={props.name || props.id}
			className={_className('ts-textarea', props.className, this.props.resizeWithText && 'no-resize')}
			value={this.state.value}
			onChange={this.changeValue}
			onKeyDown={this.onKeyDown}
			autoComplete={props.autoComplete ? 'on' : 'off'}
		/>;
	}
}
