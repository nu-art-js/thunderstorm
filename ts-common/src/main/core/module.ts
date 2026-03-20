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

import {ModuleManager} from './module-manager.js';
import {BadImplementationException} from './exceptions/exceptions.js';
import {merge} from '../utils/merge-tools.js';
import {Logger, LogLevel} from './logger/index.js';
import {TypeValidator} from '../validator/validator-core.js';
import {lastElement} from '../utils/array-tools.js';
import {TS_Object} from '../utils/types.js';
import {tsValidateEnum} from '../validator/type-validators.js';


type _ModuleConfig<C extends TS_Object> = C & { minLogLevel?: LogLevel };

/**
 * Base abstract class for all modules in the nu-art ecosystem.
 *
 * Modules are the fundamental building blocks of applications. Each module:
 * - Must be named with a `_Class` suffix (e.g., `MyModule_Class`)
 * - Automatically extracts its name from the constructor name (removing `_Class`)
 * - Has a lifecycle managed by ModuleManager: config injection → init() → validate()
 * - Inherits logging capabilities from Logger
 * - Supports config validation via ValidatorTypeResolver
 *
 * The ModuleManager calls methods in this order:
 * 1. `setManager()` - Injects the ModuleManager instance (called automatically)
 * 2. `setConfig()` - Merges config from ModuleManager (called automatically)
 * 3. `init()` - Override to perform initialization logic
 * 4. `validate()` - Override to validate module state after initialization
 *
 * @template Config - The user-facing configuration type for this module.
 *   Internal fields (e.g. minLogLevel) are computed from Config and hidden from consumers.
 *
 * @example
 * ```typescript
 * class MyModule_Class extends Module<{ apiKey: string }> {
 *   protected init() {
 *     super.init();
 *     // Initialize your module here
 *   }
 *
 *   protected validate() {
 *     // Validate module state
 *   }
 * }
 * export const MyModule = new MyModule_Class();
 * ```
 */
export abstract class Module<Config extends TS_Object = any>
	extends Logger {

	private readonly classStack: string[] = [];

	private name: string;
	/** Module configuration, merged from default config and ModuleManager-provided config */
	protected config = {} as _ModuleConfig<Config>;
	/** Reference to the ModuleManager instance, injected during initialization */
	protected readonly manager!: ModuleManager;
	/** Flag indicating whether the module has been initialized (set by ModuleManager) */
	protected readonly initiated = false;
	/** Optional config validator, set via setConfigValidator() */
	protected configValidator?: TypeValidator<_ModuleConfig<Config>>;


	/**
	 * Creates a new Module instance.
	 *
	 * **IMPORTANT**: The class name MUST end with `_Class` (e.g., `MyModule_Class`).
	 * The module name is automatically extracted by removing the `_Class` suffix.
	 *
	 * @param tag - Optional logging tag. If not provided, uses the class name (without `_Class`)
	 * @throws {BadImplementationException} If the class name doesn't end with `_Class`
	 */
	// noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
	constructor(tag?: string) {
		super(tag);
		this.name = this.constructor['name'];
		if (!this.name.endsWith('_Class'))
			throw new BadImplementationException(`Found module named: ${this.name}, Module class MUST end with '_Class' e.g. MyModule_Class`);

		this.name = this.name.replace('_Class', '');
	}

	protected addToClassStack = (cls: Function) => {
		this.classStack.push(cls.name);
	};

	public isInstanceOf = <T extends Function>(cls: T): this is T => {
		return this.classStack.includes(cls.name);
	};

	public isInstanceType = <T extends Function>(cls: T): this is T => {
		return lastElement(this.classStack) === cls.name;
	};

	/**
	 * Sets a config validator for runtime validation of module configuration.
	 *
	 * The validator is typically set in the constructor and used during `init()`
	 * to validate the merged config before the module starts operating.
	 *
	 * @param validator - Validator instance that implements ValidatorTypeResolver
	 */
	public setConfigValidator(validator: TypeValidator<Config>) {
		this.configValidator = {...validator, minLogLevel: tsValidateEnum(LogLevel, false)};
	}

	/**
	 * Sets default configuration values that will be merged with any config
	 * provided by the ModuleManager.
	 *
	 * This is typically called before ModuleManager initialization. The config
	 * is merged using deep merge, so partial configs are supported.
	 *
	 * @param config - Partial config object to merge with existing config
	 */
	public setDefaultConfig(config: Partial<_ModuleConfig<Config>>) {
		this.config = merge(this.config, config) as _ModuleConfig<Config>;
	}

	/**
	 * Gets the module name (class name without `_Class` suffix).
	 */
	public getName(): string {
		return this.name;
	}

	/**
	 * Sets a custom name for this module (overrides the auto-extracted name).
	 *
	 * @param name - Custom module name
	 */
	public setName(name: string): void {
		this.name = name;
	}

	/**
	 * Sets the module configuration, merging with existing config if present.
	 *
	 * Called automatically by ModuleManager during initialization. If `minLogLevel`
	 * is present in the config, it automatically updates the logger's minimum level.
	 *
	 * @param config - Configuration object to merge
	 */
	// @ts-ignore
	private setConfig(config: _ModuleConfig<Config>): void {
		this.config = (this.config ? merge(this.config, config) : config) as _ModuleConfig<Config>;
		this.config.minLogLevel && this.setMinLevel(this.config.minLogLevel);
	}

	/**
	 * Sets the ModuleManager instance for this module.
	 *
	 * Called automatically by ModuleManager during initialization. Provides access
	 * to other modules and the application context.
	 *
	 * @param manager - The ModuleManager instance
	 */
	// @ts-ignore
	private setManager(manager: ModuleManager): void {
		// @ts-ignore
		this['manager'] = manager;
	}

	/**
	 * Executes an async function in a fire-and-forget manner, logging the execution.
	 *
	 * The function is executed asynchronously (via setTimeout) and errors are caught
	 * and logged but not propagated. Useful for background tasks that shouldn't block
	 * the main execution flow.
	 *
	 * @param label - Label for logging purposes
	 * @param toCall - Async function to execute
	 */
	protected runAsync = (label: string, toCall: () => Promise<any>) => {
		setTimeout(() => {
			this.logDebug(`Running async: ${label}`);
			new Promise(toCall)
				.then(() => {
					this.logDebug(`Async call completed: ${label}`);
				})
				.catch(reason => this.logError(`Async call error: ${label}`, reason));
		}, 0);
	};

	/**
	 * Lifecycle hook called by ModuleManager during initialization.
	 *
	 * Override this method to perform module initialization logic. This is called
	 * after config has been injected but before `validate()`. The ModuleManager
	 * sets `initiated` to `true` after successful initialization.
	 *
	 * @example
	 * ```typescript
	 * protected init() {
	 *   super.init();
	 *   // Initialize your module here
	 *   this.setupDatabase();
	 *   this.registerRoutes();
	 * }
	 * ```
	 */
	protected init() {
		// ignorance is bliss
	}

	/**
	 * Lifecycle hook called by ModuleManager after all modules have been initialized.
	 *
	 * Override this method to validate module state, dependencies, or configuration.
	 * This is called after `init()` for all modules, allowing you to verify that
	 * dependencies are properly initialized.
	 *
	 * @example
	 * ```typescript
	 * protected validate() {
	 *   if (!this.database) {
	 *     throw new BadImplementationException('Database not initialized');
	 *   }
	 * }
	 * ```
	 */
	protected validate(): void {
		// ignorance is bliss
	}

	protected async destroy() {

	}
}