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
import {TS_BaseInput, TS_BaseInputProps} from './TS_BaseInput';
import './TS_TextArea.scss';


export type TS_TextAreaProps<Key> = TS_BaseInputProps<Key, HTMLTextAreaElement>

export class TS_TextArea<Key extends string>
	extends TS_BaseInput<Key, TS_TextAreaProps<Key>, HTMLTextAreaElement> {

	onKeyDown = (ev: KeyboardEvent<HTMLTextAreaElement>) => {
		if (!(ev.shiftKey || ev.altKey)) {
			if (ev.ctrlKey || ev.metaKey) {
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
				return;
			}

			if (ev.key === 'Escape' && this.props.onCancel) {
				this.props.onCancel();
				ev.stopPropagation();
			}
		}

		this.props.onKeyDown?.(ev);
	};

	render() {
		const {onAccept, focus, enable, ...props} = this.props;

		return <textarea
			{...props}
			ref={input => {
				if (this.ref || !input)
					return;

				this.ref = input;
				this.props.focus && this.ref.focus();
			}}
			onBlur={(event) => {
				this.ref = undefined;
				const value = event.target.value;
				this.setState({value});
				this.props.onBlur?.(value, event);
			}}
			disabled={this.props.enable === false}
			name={this.props.name || this.props.id}
			key={this.props.id}
			id={this.props.id}
			className={'ts-textarea'}
			style={this.props.style}
			value={this.state.value}
			placeholder={this.props.placeholder}
			onChange={this.changeValue}
			onKeyDown={this.props.onKeyDown || this.onKeyDown}
			autoComplete={this.props.autoComplete ? 'on' : 'off'}
			spellCheck={this.props.spellCheck}
		/>;
	}
}