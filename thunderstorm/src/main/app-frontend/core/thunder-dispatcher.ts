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

import {Dispatcher, FunctionKeys, ParamResolver, ReturnTypeResolver} from "@nu-art/ts-common";


// type ValidKeyResolver<T, K extends keyof T> = T[K] extends (...args: any) => any ? K : never

export class ThunderDispatcher<T,
	K extends FunctionKeys<T>,
	P extends ParamResolver<T, K> = ParamResolver<T, K>,
	R extends ReturnTypeResolver<T, K> = ReturnTypeResolver<T, K>>
	extends Dispatcher<T, K, P, R> {

	static readonly listenersResolver: () => any[];

	constructor(method: K) {
		super(method);
	}

	public dispatchUI(p: P): R[] {
		const listeners = ThunderDispatcher.listenersResolver();
		return listeners.filter(this.filter).map((listener: T) => {
			// @ts-ignore
			return listener[this.method](...p);
		});
	}

	public async dispatchUIAsync(p: P): Promise<R[]> {
		const listeners = ThunderDispatcher.listenersResolver();
		return Promise.all(listeners.filter(this.filter).map(async (listener: T) => {
			// @ts-ignore
			return listener[this.method](...p);
		}));
	}

	public dispatchAll(p: P): R[] {
		const moduleResponses = this.dispatchModule(p)
		const uiResponses = this.dispatchUI(p);
		return [...moduleResponses, ...uiResponses]
	}

	public async dispatchAllAsync(p: P): Promise<R[]> {
		const listenersUI = ThunderDispatcher.listenersResolver();
		const listenersModules = Dispatcher.modulesResolver();

		return Promise.all(listenersUI.concat(listenersModules).filter(this.filter).map(async (listener: T) => {
			// @ts-ignore
			return listener[this.method](...p);
		}));
	}
}

