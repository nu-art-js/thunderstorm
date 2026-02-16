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
import {ChangeEvent, KeyboardEvent, useCallback, useEffect, useRef, useState} from 'react';
import {_className} from '@nu-art/thunder-core';
import '../TS_Input.scss';
import {convertToHTMLDataAttributes, getErrorTooltip} from '../../components/types.js';
import type {NativeProps_TS_InputV2, Props_TS_InputV2, TemplatingProps_TS_InputV2} from '../v2/TS_InputV2.js';

export type {
	BaseAppLevelProps_TS_InputV2,
	InputTypeV2,
	NativeProps_TS_InputV2,
	Props_TS_InputV2,
	TemplatingProps_TS_InputV2
} from '../v2/TS_InputV2.js';

/**
 * Function component implementation of TS_InputV2 — same API surface.
 */
export function TS_InputV3(props: Props_TS_InputV2) {
	const {
		onAccept,
		allowAccept,
		showErrorTooltip,
		error,
		trim,
		forceAcceptKeys = ['ctrlKey', 'metaKey'],
		focus,
		saveEvent,
		value: controlledValue,
		onChange,
		onBlur,
		...rest
	} = props;

	const [value, setValue] = useState(controlledValue ?? '');
	const [focused, setFocused] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setValue(controlledValue ?? '');
	}, [controlledValue, props.id, props.name]);

	useEffect(() => {
		if (focus && focused && inputRef.current)
			inputRef.current.focus();
	}, [focus, focused]);

	const changeValue = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			const v = event.target.value;
			setValue(v);
			onChange?.(v, event.target.id);
		},
		[onChange]
	);

	const onKeyDown = useCallback(
		async (ev: KeyboardEvent<HTMLInputElement>) => {
			let v = ev.currentTarget.value;
			if (!(ev.shiftKey || ev.altKey || ev.ctrlKey || ev.metaKey)) {
				if (ev.key === 'Enter') {
					ev.persist();
					if (trim)
						v = v.trim();
					(ev.target as HTMLInputElement).blur();
					if (onAccept) {
						if (v !== controlledValue || allowAccept)
							await onAccept(v, ev);
						ev.stopPropagation();
					}
				}
				if (ev.key === 'Escape' && props.onCancel) {
					props.onCancel();
					ev.stopPropagation();
				}
			}
			if (ev.key === 'Enter' && forceAcceptKeys?.find(key => ev[key]))
				if (onAccept) {
					if (v !== controlledValue || allowAccept)
						await onAccept(v, ev);
					ev.stopPropagation();
				}
			props.onKeyDown?.(ev);
		},
		[trim, onAccept, allowAccept, controlledValue, forceAcceptKeys, props.onCancel, props.onKeyDown]
	);

	const handleBlur = useCallback(
		(event: React.FocusEvent<HTMLInputElement>) => {
			const v = event.target.value;
			setValue(v);
			setFocused(false);
			onBlur?.(v, event);
		},
		[onBlur]
	);

	const handleFocus = useCallback(() => setFocused(true), []);

	return (
		<input
			{...rest}
			{...convertToHTMLDataAttributes(error, 'error')}
			{...getErrorTooltip(error, showErrorTooltip)}
			autoFocus={focus}
			ref={inputRef}
			onBlur={handleBlur}
			onFocus={handleFocus}
			name={rest.name ?? rest.id}
			className={_className('ts-input', rest.className)}
			value={value}
			onChange={changeValue}
			onKeyDown={onKeyDown}
			autoComplete={rest.autoComplete ? 'on' : 'off'}
		/>
	);
}

TS_InputV3.displayName = 'TS_InputV3';

export const editableString = (templateProps: TemplatingProps_TS_InputV2) => {
	return (props: NativeProps_TS_InputV2) => <TS_InputV3 {...templateProps} {...props}/>;
};
