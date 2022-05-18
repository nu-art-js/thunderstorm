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

import {ModuleManager} from './module-manager';
import {BadImplementationException} from './exceptions';
import {merge} from '../utils/merge-tools';
import {Logger} from './logger/Logger';
import {_clearTimeout, _setTimeout, LogLevel, TimerHandler, ValidatorTypeResolver} from '..';


type _FinalConfig<Config = any> = Config & { minLogLevel?: LogLevel };

export abstract class Module<Config = any, FinalConfig extends _FinalConfig<Config> = _FinalConfig<Config>>
	extends Logger {

	private name: string;
	protected readonly manager!: ModuleManager;
	protected readonly initiated = false;
	protected readonly config: FinalConfig = {} as FinalConfig;
	protected readonly configValidator?: ValidatorTypeResolver<FinalConfig>;
	protected timeoutMap: { [k: string]: number } = {};

	// noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
	constructor(tag?: string) {
		super(tag);
		this.name = this.constructor['name'];
		if (!this.name.endsWith('_Class'))
			throw new BadImplementationException('Module class MUST end with \'_Class\' e.g. MyModule_Class');

		this.name = this.name.replace('_Class', '');
	}

	public debounce(handler: TimerHandler, key: string, ms = 0) {
		_clearTimeout(this.timeoutMap[key]);
		this.timeoutMap[key] = _setTimeout(handler, ms);
	}

	// // possibly to add
	// public async debounceSync(handler: TimerHandler, key: string, ms = 0) {
	// 	_clearTimeout(this.timeoutMap[key]);
	//
	// 	await new Promise((resolve, reject) => {
	// 		this.timeoutMap[key] = setTimeout(async (..._args) => {
	// 			try {
	// 				await handler(..._args);
	// 				resolve();
	// 			} catch (e:any) {
	// 				reject(e);
	// 			}
	// 		}, ms) as unknown as number;
	// 	});
	// }

	public throttle(handler: TimerHandler, key: string, ms = 0) {
		if (this.timeoutMap[key])
			return;
		this.timeoutMap[key] = _setTimeout(() => {
			handler();
			delete this.timeoutMap[key];
		}, ms);
	}

	public setConfigValidator(validator: ValidatorTypeResolver<FinalConfig>) {
		// @ts-ignore
		this.configValidator = validator;
	}

	public setDefaultConfig(config: Partial<FinalConfig>) {
		// @ts-ignore
		this.config = config;
	}

	public getName(): string {
		return this.name;
	}

	public setName(name: string): void {
		this.name = name;
	}

	private setConfig(config: FinalConfig): void {
		// @ts-ignore
		this.config = this.config ? merge(this.config, config || {}) : config;
		this.config.minLogLevel && this.setMinLevel(this.config.minLogLevel);
	}

	private setManager(manager: ModuleManager): void {
		// @ts-ignore
		this.manager = manager;
	}

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

	protected init(): void {
		// ignorance is bliss
	}

	protected validate(): void {
		// ignorance is bliss
	}
}