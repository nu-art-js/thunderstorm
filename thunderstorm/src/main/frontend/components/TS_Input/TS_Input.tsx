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
import {_className} from '../../utils/tools';
import {TS_BaseInput, TS_BaseInputProps} from './TS_BaseInput';
import './TS_Input.scss';


export type TS_InputProps<Key extends string | number> = TS_BaseInputProps<Key, HTMLInputElement>

/**
 * A better way to capture user input
 *
 * <code>
 * 		<input className="ts-input"/>
 * </code>
 *
 */
export class TS_Input<Key extends string = string>
	extends TS_BaseInput<Key, TS_InputProps<Key>, HTMLInputElement> {

	onKeyDown = (ev: KeyboardEvent<HTMLInputElement>) => {
		if (!(ev.shiftKey || ev.altKey || ev.ctrlKey || ev.metaKey)) {
			if (ev.key === 'Enter') {
				ev.persist();
				const value = ev.currentTarget.value;

				//@ts-ignore - despite what typescript says, ev.target does have a blur function.
				ev.target.blur();

				if (this.props.onAccept) {
					this.props.onAccept(value, ev);
					ev.stopPropagation();
				}
			}

			if (ev.key === 'Escape' && this.props.onCancel) {
				this.props.onCancel();
				ev.stopPropagation();
			}
		}

		this.props.onKeyDown?.(ev);
	};

	render() {
		const {onAccept, focus, ...props} = this.props;

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
			className={_className('ts-input', props.disabled ? 'disabled' : undefined)}
			value={this.state.value}
			onChange={this.changeValue}
			onKeyDown={this.onKeyDown}
			autoComplete={props.autoComplete ? 'on' : 'off'}
		/>;
	}
}
