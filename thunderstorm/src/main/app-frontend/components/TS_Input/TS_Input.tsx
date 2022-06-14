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
	render() {
		const {onAccept,focus,...props} = this.props;

		return <input
			{...props}
			autoFocus={focus}
			ref={props.innerRef}
			onBlur={(event) => {
				const value = event.target.value;
				this.setState({value});
				props.onBlur?.(value, event);
			}}
			disabled={props.enable === false}
			name={props.name || props.id}
			className={'ts-input'}
			value={this.state.value}
			onChange={this.changeValue}
			onKeyPress={props.onKeyPress || this.onKeyPress}
			autoComplete={props.autoComplete ? 'on' : 'off'}
		/>;
	}
}
