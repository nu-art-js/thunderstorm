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
import {Module} from "./module";
import {Dispatcher} from "./dispatcher";
import {BadImplementationException} from "./exceptions";
import {Logger} from "./logger/Logger";
import {
	addItemToArray,
	filterDuplicates
} from "../utils/array-tools";

const _modules: Module[] = [];

export function moduleResolver() {
	return _modules;
}

export class ModuleManager
	extends Logger {

	protected config!: any;
	protected modules: Module[] = _modules;
	public static instance: ModuleManager;

	// noinspection JSUnusedLocalSymbols
	protected constructor() {
		super();
		if (ModuleManager.instance)
			throw new BadImplementationException("Already have one instance of ModuleManager");

		ModuleManager.instance = this;
		Dispatcher.modulesResolver = moduleResolver;
	}

	filterModules<T>(filter: (module: any) => boolean) {
		return this.modules.filter(filter) as unknown as T[];
	}

	public setConfig(config: object) {
		this.config = config || {};
		return this;
	}

	public addModules(...modules: Module[]) {
		modules.reduce((carry: Module[], module: Module) => {
			if (!carry.includes(module))
				addItemToArray(carry, module);

			return carry
		}, this.modules);
		return this;
	}

	public setModules(...modules: Module[]) {
		this.modules = filterDuplicates(modules);
		return this;
	}

	public init(): this {
		this.logInfo(`---------  initializing app  ---------`);
		this.modules.forEach((module: Module) => {
			// @ts-ignore
			module.setManager(this);

			if (this.config)
			// @ts-ignore
				module.setConfig(this.config[module.getName()]);
		});

		this.modules.forEach(module => {
			this.logInfo(`---------  ${module.getName()}  ---------`);
			module.init();
			module.initiated = true;
		});

		// @ts-ignore
		this.modules.forEach(module => module.validate());

		this.logInfo(`---------  INITIALIZED  ---------`);
		return this;
	}

	build() {
		this.init();
	}
}