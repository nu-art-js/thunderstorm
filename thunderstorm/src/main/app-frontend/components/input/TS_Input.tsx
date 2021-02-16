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
import {
	TS_BaseInput,
	TS_BaseInputProps
} from './TS_BaseInput';

export type TS_InputProps<Key extends string | number> = TS_BaseInputProps<Key>

export class TS_Input<Key extends string = string>
	extends TS_BaseInput<Key, TS_InputProps<Key>, HTMLInputElement> {


	render() {
		return <input
			autoFocus={this.props.focus}
			ref={input => {
				if (this.ref || !input)
					return;

				this.ref = input;
				this.props.focus && this.ref.focus();
			}}
			onBlur={() => {
				this.ref = undefined;
				this.props.onBlur?.();
			}}
			disabled={this.props.enable === false}
			name={this.props.name || this.props.id}
			key={this.props.id}
			id={this.props.id}
			className={this.props.className}
			style={this.props.style}
			value={this.state.value}
			placeholder={this.props.placeholder}
			onChange={this.changeValue}
			onKeyPress={this.props.handleKeyEvent || this.handleKeyEvent}
			autoComplete={this.props.autocomplete ? "on" : "off"}
			spellCheck={this.props.spellCheck}
			type={this.props.type}
		/>;
	}
}