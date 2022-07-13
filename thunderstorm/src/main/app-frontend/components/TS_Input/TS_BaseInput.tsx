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
import {ComponentSync} from '../../core/ComponentSync';


export type InputType = 'text' | 'number' | 'password';

export type TS_BaseInputProps<Key, Element> = Omit<HTMLProps<Element>, 'onChange' | 'onBlur'> & {
	type: InputType
	style?: CSSProperties
	id?: Key
	onChange?: (value: string, id: Key) => void
	onAccept?: (value: string, event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void
	blurOnAccept?: boolean;
	onCancel?: () => void
	onBlur?: (value: string, event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
	placeholder?: string
	enable?: boolean
	value?: string
	onKeyPress?: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void
	focus?: boolean
	spellCheck?: boolean
	autoComplete?: boolean
	innerRef?: React.RefObject<any>;
}

type InputState = {}

export abstract class TS_BaseInput<Key extends string, Props extends TS_BaseInputProps<Key, Input>, Input = HTMLInputElement | HTMLTextAreaElement>
	extends ComponentSync<Props, InputState> {

	protected ref?: HTMLInputElement | HTMLTextAreaElement;

	protected deriveStateFromProps(nextProps: Props): InputState | undefined {
		return {
			value: nextProps.value || ''
		};
	}

	changeValue = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const value = event.target.value;
		this.props.onChange?.(value, event.target.id as Key);
	};
}