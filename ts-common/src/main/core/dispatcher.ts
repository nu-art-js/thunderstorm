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

import {FunctionKeys, ReturnPromiseType} from '../utils/types.js';
import {Logger} from './logger/index.js';


/**
 * Type helper that extracts parameter types from a method on type T.
 * 
 * @template T - The type containing the method
 * @template K - The method key
 */
export type ParamResolver<T, K extends keyof T> = T[K] extends (...args: any) => any ? Parameters<T[K]> : never

/**
 * Type helper that extracts return type from a method on type T, unwrapping Promises.
 * 
 * @template T - The type containing the method
 * @template K - The method key
 */
export type ReturnTypeResolver<T, K extends keyof T> = T[K] extends (...args: any) => any ? ReturnPromiseType<T[K]> : never

/**
 * Base processor class that filters and processes modules based on method presence.
 * 
 * Processor finds all modules that have a specific method and allows processing
 * them in various ways (sync, async parallel, async serial).
 * 
 * The `modulesResolver` must be set by ModuleManager during initialization to
 * provide access to all registered modules.
 * 
 * @template T - The interface/type that modules should implement
 * @template K - The method name to look for on modules
 * 
 * @example
 * ```typescript
 * interface EventHandler {
 *   onEvent(data: string): void;
 * }
 * 
 * const processor = new Processor<EventHandler, 'onEvent'>('onEvent');
 * processor.processModules(module => {
 *   module.onEvent('data');
 * });
 * ```
 */
export class Processor<T, K extends FunctionKeys<T>>
	extends Logger {

	/** Function that returns all registered modules (set by ModuleManager) */
	static modulesResolver: () => any[];

	/** The method name this processor is looking for */
	readonly method: K;
	/** Filter function that checks if a module has the target method */
	protected readonly filter: (listener: any) => boolean;

	/**
	 * Creates a new Processor for a specific method.
	 * 
	 * @param method - The method name to look for on modules
	 */
	constructor(method: K) {
		super(method as string);
		this.method = method;
		this.filter = (listener: any) => !!listener[this.method];
	}

	/**
	 * Processes all matching modules synchronously.
	 * 
	 * Filters modules that have the target method and applies the processor
	 * function to each, collecting results in an array.
	 * 
	 * @param processor - Function to apply to each matching module
	 * @returns Array of results from processing each module
	 */
	public processModules<R>(processor: (item: T) => R): R[] {
		return this.filterModules().filter(this.filter).map(processor);
	}

	/**
	 * Processes all matching modules asynchronously in parallel.
	 * 
	 * All modules are processed concurrently using Promise.all. Use this
	 * when modules can be processed independently and order doesn't matter.
	 * 
	 * @param processor - Async function to apply to each matching module
	 * @returns Promise that resolves to an array of results
	 */
	public async processModulesAsync<R>(processor: (item: T) => Promise<R>): Promise<R[]> {
		return Promise.all(this.filterModules().map(processor));
	}

	/**
	 * Processes all matching modules asynchronously in serial (one after another).
	 * 
	 * Modules are processed sequentially, waiting for each to complete before
	 * starting the next. Use this when order matters or when operations must
	 * not overlap.
	 * 
	 * @param processor - Async function to apply to each matching module
	 * @returns Promise that resolves to an array of results in processing order
	 */
	public async processModulesAsyncSerial<R>(processor: (item: T) => Promise<R>): Promise<R[]> {
		const modules = this.filterModules();
		const toRet: R[] = [];
		for (const module of modules) {
			toRet.push(await processor(module));
		}
		return toRet;
	}

	/**
	 * Filters all modules to those that have the target method.
	 * 
	 * @returns Array of modules that implement the target method
	 */
	filterModules() {
		const listeners = Dispatcher.modulesResolver();
		return listeners.filter(this.filter);
	}
}

/**
 * Event dispatcher that calls a specific method on all modules that implement it.
 * 
 * Dispatcher extends Processor to provide a convenient way to invoke a method
 * on all matching modules with proper type safety. It automatically:
 * - Finds all modules that have the target method
 * - Calls the method with the provided parameters
 * - Collects and returns the results
 * 
 * Supports three dispatch modes:
 * - **Synchronous**: Calls all modules immediately, returns array of results
 * - **Async Parallel**: Calls all modules concurrently, returns Promise of results
 * - **Async Serial**: Calls modules one at a time, returns Promise of results in order
 * 
 * @template T - The interface that modules should implement
 * @template K - The method name to dispatch
 * @template P - Parameter types for the method (inferred from T[K])
 * @template R - Return type for the method (inferred from T[K], unwrapped from Promise)
 * 
 * @example
 * ```typescript
 * interface ConfigValidator {
 *   validateConfig(config: any): boolean;
 * }
 * 
 * const dispatcher = new Dispatcher<ConfigValidator, 'validateConfig'>('validateConfig');
 * const results = dispatcher.dispatchModule(myConfig);
 * // results is boolean[]
 * ```
 */
export class Dispatcher<T,
	K extends FunctionKeys<T>,
	P extends ParamResolver<T, K> = ParamResolver<T, K>,
	R extends ReturnTypeResolver<T, K> = ReturnTypeResolver<T, K>>
	extends Processor<T, K> {

	/**
	 * Creates a new Dispatcher for a specific method.
	 * 
	 * @param method - The method name to dispatch to modules
	 */
	constructor(method: K) {
		super(method);
	}

	/**
	 * Dispatches the method call to all matching modules synchronously.
	 * 
	 * Calls the target method on each module that implements it, passing
	 * the provided parameters. Returns an array of all return values.
	 * 
	 * @param p - Parameters to pass to the method (spread arguments)
	 * @returns Array of return values from each module
	 */
	public dispatchModule(...p: P): R[] {
		return this.processModules((listener: T) => {
			// @ts-ignore
			return (listener[this.method])(...p);
		});
	}

	/**
	 * Dispatches the method call to all matching modules asynchronously in parallel.
	 * 
	 * All modules are called concurrently. Use this when modules can process
	 * independently and order doesn't matter.
	 * 
	 * @param p - Parameters to pass to the method (spread arguments)
	 * @returns Promise that resolves to an array of return values
	 */
	public async dispatchModuleAsync(...p: P): Promise<R[]> {
		return this.processModulesAsync<R>((listener: T) => {
			// const newVar = this.resolveListenerName(listener);
			// this.logVerbose(`Calling ${newVar} (${p})`);
			// @ts-ignore
			return listener[this.method](...p);
		});
	}

	// private resolveListenerName(listener: any) {
	// 	return 'name' in listener ? listener.name :
	// 		'constructor' in listener ? listener['constructor']['name'] : '';
	// }

	/**
	 * Dispatches the method call to all matching modules asynchronously in serial.
	 * 
	 * Modules are called one at a time, waiting for each to complete before
	 * calling the next. Use this when order matters or operations must not overlap.
	 * 
	 * @param p - Parameters to pass to the method (spread arguments)
	 * @returns Promise that resolves to an array of return values in call order
	 */
	public async dispatchModuleAsyncSerial(...p: P): Promise<R[]> {
		return this.processModulesAsyncSerial<R>((listener: T) => {
			// @ts-ignore
			return listener[this.method](...p);
		});
	}
}
