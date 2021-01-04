/*
 * ts-common is the basic building blocks of our typescript projects
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
	FunctionKeys,
	ReturnPromiseType
} from "../utils/types";

export class Dispatcher<T extends object, K extends FunctionKeys<T>> {

	static modulesResolver: () => any[];

	protected readonly method: K;
	protected readonly filter: (listener: any) => boolean;

	constructor(method: K) {
		this.method = method;
		this.filter = (listener: any) => !!listener[this.method];
	}

	public dispatchModule(p: Parameters<T[K]>): ReturnPromiseType<T[K]>[] {
		const listeners = Dispatcher.modulesResolver();
		const params: any = p;
		return listeners.filter(this.filter).map((listener: T) => listener[this.method](...params));
	}

	public async dispatchModuleAsync(p: Parameters<T[K]>): Promise<ReturnPromiseType<T[K]>[]> {
		const listeners = Dispatcher.modulesResolver();
		return Promise.all(listeners.filter(this.filter).map(async (listener: T) => {
			const params: any = p;
			return listener[this.method](...params);
		}));
	}
}


