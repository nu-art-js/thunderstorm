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
import {Module} from './module';
import {Dispatcher} from './dispatcher';
import {BadImplementationException} from './exceptions/exceptions';
import {Logger} from './logger/Logger';
import {addItemToArray} from '../utils/array-tools';
import {exists} from '../utils/tools';


const _modules: Module[] = [];

export function moduleResolver() {
	return _modules;
}

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
export const RuntimeModules = () => ModuleManager.instance.modules;
export const RuntimeVersion = () => ModuleManager.instance.version;
export const RuntimeEnvironment = () => ModuleManager.instance.getEnvironment();

export class ModuleManager
	extends Logger {

	protected config!: any;
	readonly modules = modulesInterface;
	public static instance: ModuleManager;
	readonly version?: string;

	protected constructor() {
		super();
		if (ModuleManager.instance)
			throw new BadImplementationException('Already have one instance of ModuleManager');

		ModuleManager.instance = this;
		Dispatcher.modulesResolver = moduleResolver;
	}

	// @ts-ignore
	private static resetForTests() {
		_modules.length = 0;
		// @ts-ignore
		delete ModuleManager.instance;
	}

	public setConfig(config: object) {
		this.config = config || {};
		return this;
	}

	public setVersion(version: string) {
		// @ts-ignore
		this.version = version;
		return this;
	}

	public addModulePack(modules: Module[]) {
		modules.reduce((carry: Module[], module: Module) => {
			if (!carry.includes(module))
				addItemToArray(carry, module);

			return carry;
		}, this.modules.all);
		return this;
	}

	public init(): this {
		if (this.config.logLevel)
			this.setMinLevel(this.config.logLevel);

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

			if (this.config)
				// @ts-ignore
				module.setConfig(this.config[module.getName()]);
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

	build() {
		this.init();
	}

	public getEnvironment(): string {
		return '';
	}
}