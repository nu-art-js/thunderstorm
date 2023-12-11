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

import {Module,} from '@nu-art/ts-common';
import {ThunderDispatcher} from '../core/thunder-dispatcher';


type Config = {}

export interface OnWindowResized {
	__onWindowResized(): void;
}

const dispatch_WindowResized = new ThunderDispatcher<OnWindowResized, '__onWindowResized'>('__onWindowResized');

export interface OnWindowReceivedFocus {
	__onWindowReceivedFocus(): void;
}

const dispatch_WindowReceivedFocus = new ThunderDispatcher<OnWindowReceivedFocus, '__onWindowReceivedFocus'>('__onWindowReceivedFocus');

export interface OnWindowLostFocus {
	__onWindowLostFocus(): void;
}

const dispatch_WindowLostFocus = new ThunderDispatcher<OnWindowLostFocus, '__onWindowLostFocus'>('__onWindowLostFocus');

export class ModuleFE_Window_Class
	extends Module<Config> {

	protected init(): void {
		window.addEventListener('resize', this.onWindowResized);
		window.addEventListener('focus', this.onWindowReceivedFocus);
		window.addEventListener('blur', this.onWindowLostFocus);

	}

	private onWindowResized = () => {
		dispatch_WindowResized.dispatchUI();
	};

	private onWindowReceivedFocus = () => {
		dispatch_WindowReceivedFocus.dispatchUI();
	};

	private onWindowLostFocus = () => {
		dispatch_WindowLostFocus.dispatchUI();
	};
}

export const ModuleFE_Window = new ModuleFE_Window_Class();

