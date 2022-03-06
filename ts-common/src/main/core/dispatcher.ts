/*
 * ts-common is the basic building blocks of our typescript projects
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

import {FunctionKeys, ReturnPromiseType} from '../utils/types';

export type ParamResolver<T, K extends keyof T> = T[K] extends (...args: any) => any ? Parameters<T[K]> : never
export type ReturnTypeResolver<T, K extends keyof T> = T[K] extends (...args: any) => any ? ReturnPromiseType<T[K]> : never

export class Dispatcher<T,
	K extends FunctionKeys<T>,
	P extends ParamResolver<T, K> = ParamResolver<T, K>,
	R extends ReturnTypeResolver<T, K> = ReturnTypeResolver<T, K>> {

	static modulesResolver: () => any[];

	readonly method: K;
	protected readonly filter: (listener: any) => boolean;

	constructor(method: K) {
		this.method = method;
		this.filter = (listener: any) => !!listener[this.method];
	}

	public dispatchModule(p: P): R[] {
		const listeners = Dispatcher.modulesResolver();
		return listeners.filter(this.filter).map((listener: T) => {
			// @ts-ignore
			return (listener[this.method])(...p);
		});
	}

	public async dispatchModuleAsync(p: P): Promise<R[]> {
		const listeners = Dispatcher.modulesResolver();
		return Promise.all(listeners.filter(this.filter).map(async (listener: T) => {
			// @ts-ignore
			return listener[this.method](...p);
		}));
	}
}


