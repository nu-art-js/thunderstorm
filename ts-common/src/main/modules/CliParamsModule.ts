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

import {Module} from '../core/module';
import {TS_Object, TypedMap} from '../utils/types';
import {BadImplementationException, ImplementationMissingException} from '../core/exceptions';
import {filterInstances, flatArray} from '../utils/array-tools';


export type CliParam<K, T extends string | string[] = string> = {
	keys: string[];
	name: string;
	keyName: K;
	optional?: true;
	options?: string[];
	defaultValue?: T;
	isArray?: T extends string[] ? true : never;
	process?: (value: T) => T;
}

type Param = CliParam<string> | CliParam<string, string[]>;
type Config = {
	params: Param[];
}

class CliParamsModule_Class
	extends Module<Config> {

	private paramsValue: TypedMap<string | string[] | undefined> = {};

	init() {
		this.config.params.forEach((param) => this.paramsValue[param.keyName] = this.getParam<any>(param));
		this.printHowTo(this.config.params);
		return this.paramsValue;
	}

	getParam<T extends string | string[]>(param: CliParam<string, T>, args: string[] = process.argv.slice(2, process.argv.length)) {
		if (!this.config.params.find(_param => _param.keyName === param.keyName))
			throw new BadImplementationException('Requested not existing param');

		let value: T | undefined = this.extractParam(param, args) as T;
		if (!value)
			value = param.defaultValue;

		if (!value)
			return value as T;

		return (param.process ? param.process(value) : value);
	}

	private extractParam<T extends string | string[]>(param: CliParam<string, T>, argv: string[]) {
		if (param.isArray)
			return param.keys.reduce((values: string[], key) => {
				values.push(...filterInstances(argv.map(arg => arg.match(new RegExp(`${key}=(.*)`))?.[1])));
				return values;
			}, []);

		const find = param.keys.map(key => argv.map(arg => arg.match(new RegExp(`${key}=(.*)`))?.[1]));
		return flatArray(find).find(k => k);
	}

	printHowTo = (params: Param[]) => {
		const missingParams = params.filter((param) => !this.paramsValue[param.keyName] && !param.optional);
		const foundParams = params.filter((param) => this.paramsValue[param.keyName]);

		this.printFoundArgs('Found Args', foundParams, this.paramsValue);
		if (missingParams.length === 0)
			return;

		this.printFoundArgs('Missing Args', missingParams, this.paramsValue);
		throw new ImplementationMissingException('Missing cli params');
	};

	private printFoundArgs(title: string, params: Param[], foundArgs: TS_Object) {
		if (params.length)
			return;

		this.logInfoBold(`  ${title}:`);
		params.forEach((param) => this.logInfo(`    ${param.keys[0]}=${foundArgs[param.keyName] || `<${param.name}>`}`));
	}

	getParams = () => {
		return this.paramsValue;
	};
}

export const CliParamsModule = new CliParamsModule_Class();
