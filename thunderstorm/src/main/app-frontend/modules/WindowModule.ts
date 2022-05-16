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

export class WindowModule_Class
	extends Module<Config> {

	protected init(): void {
		window.addEventListener('resize', this.onWindowResized);
	}

	private onWindowResized = () => {
		dispatch_WindowResized.dispatchUI();
	};
}

export const WindowModule = new WindowModule_Class();

