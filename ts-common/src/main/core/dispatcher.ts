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
import {Logger} from './logger/Logger';


export type ParamResolver<T, K extends keyof T> = T[K] extends (...args: any) => any ? Parameters<T[K]> : never
export type ReturnTypeResolver<T, K extends keyof T> = T[K] extends (...args: any) => any ? ReturnPromiseType<T[K]> : never

export class Processor<T, K extends FunctionKeys<T>>
	extends Logger {

	static modulesResolver: () => any[];

	readonly method: K;
	protected readonly filter: (listener: any) => boolean;

	constructor(method: K) {
		super(method as string);
		this.method = method;
		this.filter = (listener: any) => !!listener[this.method];
	}

	public processModules<R>(processor: (item: T) => R): R[] {
		return this.filterModules().filter(this.filter).map(processor);
	}

	public async processModulesAsync<R>(processor: (item: T) => Promise<R>): Promise<R[]> {
		return Promise.all(this.filterModules().map(processor));
	}

	public async processModulesAsyncSerial<R>(processor: (item: T) => Promise<R>): Promise<R[]> {
		const modules = this.filterModules();
		const toRet: R[] = [];
		for (const module of modules) {
			toRet.push(await processor(module));
		}
		return toRet;
	}

	filterModules() {
		const listeners = Dispatcher.modulesResolver();
		return listeners.filter(this.filter);
	}
}

export class Dispatcher<T,
	K extends FunctionKeys<T>,
	P extends ParamResolver<T, K> = ParamResolver<T, K>,
	R extends ReturnTypeResolver<T, K> = ReturnTypeResolver<T, K>>
	extends Processor<T, K> {

	constructor(method: K) {
		super(method);
	}

	public dispatchModule(...p: P): R[] {
		return this.processModules((listener: T) => {
			// @ts-ignore
			return (listener[this.method])(...p);
		});
	}

	public async dispatchModuleAsync(...p: P): Promise<R[]> {
		return this.processModulesAsync<R>((listener: T) => {
			// @ts-ignore
			return listener[this.method](...p);
		});
	}

	public async dispatchModuleAsyncSerial(...p: P): Promise<R[]> {
		return this.processModulesAsync<R>((listener: T) => {
			// @ts-ignore
			return listener[this.method](...p);
		});
	}
}
