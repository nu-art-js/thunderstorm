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

/**
 * Created by tacb0ss on 08/07/2018.
 */
import {Module} from './module.js';
import {Dispatcher} from './dispatcher.js';
import {BadImplementationException} from './exceptions/exceptions.js';
import {Logger} from './logger/index.js';
import {addItemToArray} from '../utils/array-tools.js';
import {exists} from '../utils/tools.js';


const _modules: Module[] = [];

/**
 * Returns the internal modules array. Used by Dispatcher to resolve modules.
 *
 * @internal
 */
export function moduleResolver() {
	return _modules;
}

/**
 * Type-safe wrapper around the modules array that provides array-like methods
 * with generic type support. This allows modules to be queried and filtered
 * while maintaining type information.
 */
const modulesInterface = {
	filter: <T>(filter: (item: T, index: number, array: T[]) => boolean) => {
		return _modules.filter(filter as (item: Module, index: number, array: Module[]) => boolean) as T[];
	},
	find: <T>(filter: (item: T, index: number, array: T[]) => boolean) => {
		return _modules.find(filter as (item: Module, index: number, array: Module[]) => boolean) as T;
	},
	some: <T>(filter: (item: T, index: number, array: T[]) => boolean) => {
		return _modules.some(filter as (item: Module, index: number, array: Module[]) => boolean) as T;
	},
	map: <T, S>(processor: (item: T, index: number, array: T[]) => S) => {
		return _modules.map(processor as (item: Module, index: number, array: Module[]) => S) as S[];
	},
	forEach: <T>(processor: (item: T, index: number, array: T[]) => void) => {
		return _modules.forEach(processor as (item: Module, index: number, array: Module[]) => void);
	},
	includes: <T>(module: T) => {
		return _modules.includes(module as Module);
	},
	all: _modules
};

/**
 * Runtime function to access all registered modules.
 *
 * @returns The modules interface for querying modules
 */
export const RuntimeModules = () => ModuleManager.instance.modules;

/**
 * Runtime function to get the application version.
 *
 * @returns The version string if set, undefined otherwise
 */
export const RuntimeVersion = () => ModuleManager.instance.version;

/**
 * Runtime function to get the current environment.
 *
 * @returns The environment string (typically overridden by subclasses)
 */
export const RuntimeEnvironment = () => ModuleManager.instance.getEnvironment();

/**
 * Singleton manager that coordinates the lifecycle of all modules in an application.
 *
 * ModuleManager is responsible for:
 * - Registering modules (via `addModulePack()`)
 * - Injecting configuration into modules
 * - Initializing modules in order
 * - Validating modules after initialization
 * - Providing runtime access to modules
 *
 * The initialization sequence is:
 * 1. Config injection: Each module receives its config from `this.config[moduleName]`
 * 2. Manager injection: Each module receives a reference to this ModuleManager
 * 3. Module initialization: `init()` is called on each module (errors are caught and logged)
 * 4. Module validation: `validate()` is called on each module
 *
 * @example
 * ```typescript
 * class MyApp extends ModuleManager {
 *   constructor() {
 *     super();
 *     this.addModulePack([ModuleA, ModuleB, ModuleC]);
 *     this.setConfig({
 *       ModuleA: { apiKey: '...' },
 *       ModuleB: { database: '...' }
 *     });
 *   }
 * }
 *
 * const app = new MyApp();
 * app.init();
 * ```
 */
export class ModuleManager
	extends Logger {

	/** Application-wide configuration, keyed by module name */
	protected config: any = {};
	/** Type-safe interface for querying registered modules */
	readonly modules = modulesInterface;
	/** Singleton instance of ModuleManager */
	public static instance: ModuleManager;
	/** Application version string */
	readonly version?: string;

	/**
	 * Creates a new ModuleManager instance.
	 *
	 * Enforces singleton pattern - only one instance can exist. Also registers
	 * the module resolver with the Dispatcher system.
	 *
	 * @throws {BadImplementationException} If an instance already exists
	 */
	protected constructor() {
		super();
		if (ModuleManager.instance)
			throw new BadImplementationException('Already have one instance of ModuleManager');

		ModuleManager.instance = this;
		Dispatcher.modulesResolver = moduleResolver;
	}

	/**
	 * Resets the ModuleManager state for testing purposes.
	 *
	 * @internal
	 */
	// @ts-ignore
	static async destroy() {
		await Promise.allSettled(_modules.map(async module => {
			// @ts-ignore
			return await module.destroy();
		}));

		_modules.length = 0;
		// @ts-ignore
		delete ModuleManager.instance;
	}

	/**
	 * Sets the application-wide configuration.
	 *
	 * Configuration is keyed by module name and will be injected into each module
	 * during initialization. The config object structure should match module names:
	 * `{ ModuleName: { ...moduleConfig } }`
	 *
	 * @param config - Configuration object keyed by module names
	 * @returns This instance for method chaining
	 */
	public setConfig(config: object) {
		this.config = config || {};
		return this;
	}

	/**
	 * Sets the application version string.
	 *
	 * @param version - Version string (e.g., "1.0.0")
	 * @returns This instance for method chaining
	 */
	public setVersion(version: string) {
		// @ts-ignore
		this['version'] = version;
		return this;
	}

	/**
	 * Registers a pack of modules with the manager.
	 *
	 * Modules are deduplicated - if a module is already registered, it won't be
	 * added again. This allows module packs to be safely combined.
	 *
	 * @param modules - Array of module instances to register
	 * @returns This instance for method chaining
	 */
	public addModulePack(modules: Module[]) {
		modules.reduce((carry: Module[], module: Module) => {
			if (!carry.includes(module))
				addItemToArray(carry, module);

			return carry;
		}, this.modules.all);
		return this;
	}

	/**
	 * Initializes all registered modules in the correct sequence.
	 *
	 * The initialization process:
	 * 1. Sets the global log level if specified in config
	 * 2. Validates that no modules are undefined (catches cyclic import issues)
	 * 3. Injects ModuleManager reference and config into each module
	 * 4. Calls `init()` on each module (errors are caught and logged, but don't stop initialization)
	 * 5. Calls `validate()` on each module after all have been initialized
	 *
	 * **Note**: If a module's `init()` throws an error, the error is logged but initialization
	 * continues for other modules. The failed module will not have `initiated` set to true,
	 * but `validate()` will still be called on it.
	 *
	 * @returns This instance for method chaining
	 * @throws {BadImplementationException} If any module is undefined (cyclic import issue)
	 */
	public init(): this {
		if (this.config.logLevel) {
			this.setMinLevel(this.config.logLevel);
			this.modules.forEach((module: Module) => module.setMinLevel(this.config.logLevel));
		}

		this.logInfo(`---------  initializing app  ---------`);
		const undefinedModule: boolean = this.modules.some(module => !exists(module));
		if (undefinedModule) {
			const modulesList = JSON.stringify(this.modules.map(module => {
				// @ts-ignore
				return module?.tag
					|| 'undefined';
			}), null, 2);
			throw new BadImplementationException(`Module was 'undefined' - probably cyclic import mess here are the list of modules: \n${modulesList}`);
		}

		this.modules.forEach((module: Module) => {
			// @ts-ignore
			module.setManager(this);

			const moduleConfig = this.config[module.getName()];
			if (this.config && exists(moduleConfig))
				// @ts-ignore
				module.setConfig(moduleConfig);
		});

		this.modules.forEach((module: Module) => {
			this.logDebug(`---------  ${module.getName()}  ---------`);
			try { // @ts-ignore
				module.init();
				// @ts-ignore
				module.initiated = true;
			} catch (e: any) {
				this.logError(`Failed to init module ${module.getName()}.\n`, e);
			}
		});

		// @ts-ignore
		this.modules.forEach(module => module.validate());

		this.logInfo(`---------  INITIALIZED  ---------`);
		return this;
	}

	/**
	 * Convenience method that calls `init()`. Provided for API consistency.
	 *
	 * @returns This instance for method chaining
	 */
	build() {
		this.init();
	}

	/**
	 * Returns the current environment string.
	 *
	 * Base implementation returns an empty string. Subclasses (like BaseStorm)
	 * should override this to return the actual environment (e.g., "development", "production").
	 *
	 * @returns Environment string (empty string by default)
	 */
	public getEnvironment(): string {
		return '';
	}
}