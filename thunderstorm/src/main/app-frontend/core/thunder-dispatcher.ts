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

import {Dispatcher} from "@nu-art/ts-common";

export type FunctionKeys<T> = { [K in keyof T]: T[K] extends (...args: any) => any ? K : never }[keyof T];
// type A = { p: () => string; k: string };

// type B = FunctionKeys<A>;
// const a: A = {
// 	p: () => "p",
// 	k: "K"
// }
//
// const b:B ="k"
//
// console.log(b)


export type DeflatePromise<T> = T extends Promise<infer A> ? A : T

export type ReturnPromiseType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? DeflatePromise<R> : never;


export class ThunderDispatcher<T extends object, K extends FunctionKeys<T>, P extends Parameters<T[K]> = Parameters<T[K]>>
	extends Dispatcher<T, K> {

	static readonly listenersResolver: () => any[];

	constructor(method: K) {
		super(method);
	}

	public dispatchUI(p: P): ReturnPromiseType<T[K]>[] {
		const listeners = ThunderDispatcher.listenersResolver();
		return listeners.filter(this.filter).map((listener: T) => listener[this.method](...p));
	}

	public async dispatchUIAsync(p: P): Promise<ReturnPromiseType<T[K]>[]> {
		const listeners = ThunderDispatcher.listenersResolver();
		return Promise.all(listeners.filter(this.filter).map(async (listener: T) => {
			const params: any = p;
			return listener[this.method](...params);
		}));
	}

	public dispatchAll(p: Parameters<T[K]>): ReturnPromiseType<T[K]>[] {
		const moduleResponses = this.dispatchModule(p)
		const uiResponses = this.dispatchUI(p as P);
		return [...moduleResponses, ...uiResponses]
	}

	public async dispatchAllAsync(p: Parameters<T[K]>): Promise<ReturnPromiseType<T[K]>[]> {
		const listenersUI = ThunderDispatcher.listenersResolver();
		const listenersModules = Dispatcher.modulesResolver();

		return Promise.all(listenersUI.concat(listenersModules).filter(this.filter).map(async (listener: T) => {
			const params: any = p;
			return listener[this.method](...params);
		}));
	}
}

