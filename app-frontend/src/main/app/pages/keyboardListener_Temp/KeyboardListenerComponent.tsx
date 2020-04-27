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

import * as React from "react";
import {BaseComponent} from "@nu-art/thunderstorm/frontend";
import {
	SpecialKeyboardListener,
	SpecialKeyboardListenerModule
} from "@nu-art/thunderstorm/app-frontend/modules/SpecialKeyboardListenerModule";

export type KeyboardListenerComponentProps = {
	enableKeyboardControl?: boolean,
	myListenerKey?: string,
}

export type KeyboardListenerComponentState = {}

export abstract class KeyboardListenerComponent<P extends KeyboardListenerComponentProps, S extends {}>
	extends BaseComponent
	implements SpecialKeyboardListener {

	protected myListener = this.props.enableKeyboardControl && this.props.myListenerKey ? SpecialKeyboardListenerModule(this.props.myListenerKey) : undefined;
	protected node: any = null;

	__onKeyEvent = (key: string, e: KeyboardEvent) => {
		if (!this.props.enableKeyboardControl || key !== this.props.myListenerKey)
			return;
		this.keyEventHandler && this.keyEventHandler(e);
	};

	onFocus = () => {
		this.myListener && this.myListener.addKeyboardEventListener();
		this.onFocusHandler && this.onFocusHandler();
	};

	onBlur = () => {
		this.myListener && this.myListener.removeKeyboardEventListener();
		this.onBlurHandler && this.onBlurHandler();
	};

	render() {
		return <>
			<div
				ref={node => this.node = node}
				tabIndex={this.props.enableKeyboardControl ? 1 : undefined}
				className={'match_width match_height'}
				onFocus={this.onFocus}
				onBlur={this.onBlur}>
				{this.renderContent()}
			</div>
		</>
	}

	protected keyEventHandler?(e: KeyboardEvent): void;

	protected onFocusHandler?(): void;

	protected onBlurHandler?(): void;

	protected abstract renderContent(): React.ReactNode;
}