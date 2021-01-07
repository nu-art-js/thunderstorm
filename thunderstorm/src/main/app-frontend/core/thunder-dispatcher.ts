/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
 *
 * Copyright (C) 2020 Intuition Robotics
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

import {
	Dispatcher,
	FunctionKeys,
	ReturnPromiseType
} from "@intuitionrobotics/ts-common";

export class ThunderDispatcher<T extends object, K extends FunctionKeys<T>>
	extends Dispatcher<T, K> {

	static readonly listenersResolver: () => any[];

	constructor(method: K) {
		super(method);
	}

	public dispatchUI(p: Parameters<T[K]>): ReturnPromiseType<T[K]>[] {
		const listeners = ThunderDispatcher.listenersResolver();
		// @ts-ignore
		return listeners.filter(this.filter).forEach((listener: T) => listener[this.method](...p));
	}

	public async dispatchUIAsync(p: Parameters<T[K]>): Promise<ReturnPromiseType<T[K]>[]> {
		const listeners = ThunderDispatcher.listenersResolver();
		return Promise.all(listeners.filter(this.filter).map(async (listener: T) => {
			const params: any = p;
			return listener[this.method](...params);
		}));
	}
}

