/*
 * A typescript & react boilerplate with api call example
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
import {Stylable} from './Stylable';

export type KeyboardListenerProps = Stylable & {
	onKeyboardEventListener: (e: React.KeyboardEvent) => void
	onFocus?: () => void
	onBlur?: () => void
	id?: string
}

export class KeyboardListener<P extends KeyboardListenerProps>
	extends React.Component<P> {

	private node?: HTMLDivElement;

	private addKeyboardListener() {
		const onKeyboardEventListener = this.props.onKeyboardEventListener;
		if (!onKeyboardEventListener)
			return;

		this.node?.addEventListener('keydown', this.keyboardEventHandler);
	}

	private removeKeyboardListener() {
		const onKeyboardEventListener = this.props.onKeyboardEventListener;
		if (!onKeyboardEventListener)
			return;

		this.node?.removeEventListener('keydown', this.keyboardEventHandler);
	}

	keyboardEventHandler = (e: KeyboardEvent) => this.node && this.props.onKeyboardEventListener && this.props.onKeyboardEventListener(e as unknown as React.KeyboardEvent);

	onFocus = () => {
		this.addKeyboardListener();
		this.props.onFocus && this.props.onFocus();
	};

	onBlur = () => {
		this.removeKeyboardListener();
		this.props.onBlur && this.props.onBlur();
	};

	render() {
		return <div
			id={this.props.id ? `${this.props.id}-listener` : ''}
			ref={(node: HTMLDivElement) => {
				if (this.node)
					return;

				this.node = node;
				this.forceUpdate();
			}}
			className={this.props.className}
			style={this.props.style}
			tabIndex={1}
			onFocus={this.onFocus}
			onBlur={this.onBlur}>
			{this.props.children}
		</div>;
	}
}