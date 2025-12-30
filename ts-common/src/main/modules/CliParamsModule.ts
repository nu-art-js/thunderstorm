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

import {Module} from '../core/module.js';
import {TS_Object, TypedMap} from '../utils/types.js';
import {BadImplementationException, ImplementationMissingException} from '../core/exceptions/exceptions.js';
import {filterInstances, flatArray} from '../utils/array-tools.js';


/**
 * Configuration for a CLI parameter.
 * 
 * @template K - The key name type for the parameter
 * @template T - The value type (string or string[])
 */
export type CliParam<K, T extends string | string[] = string> = {
	/** Array of CLI flag patterns (e.g., ["--key", "-k"]) */
	keys: string[];
	/** Human-readable name for the parameter */
	name: string;
	/** Unique key name for accessing the parameter value */
	keyName: K;
	/** If true, parameter is optional */
	optional?: true;
	/** Valid option values (for validation) */
	options?: string[];
	/** Default value if parameter is not provided */
	defaultValue?: T;
	/** If true, parameter accepts multiple values (array) */
	isArray?: T extends string[] ? true : never;
	/** Optional processor function to transform the value */
	process?: (value: T) => T;
}

type Param = CliParam<string> | CliParam<string, string[]>;
type Config = {
	params: Param[];
}

/**
 * Module for parsing and validating command-line arguments.
 * 
 * Parses CLI arguments in the format `key=value` and provides type-safe access
 * to parameter values. Supports optional parameters, default values, arrays,
 * and custom value processing.
 * 
 * @example
 * ```typescript
 * CliParamsModule.setDefaultConfig({
 *   params: [
 *     { keys: ['--api-key', '-k'], name: 'API Key', keyName: 'apiKey' },
 *     { keys: ['--port'], name: 'Port', keyName: 'port', defaultValue: '3000' }
 *   ]
 * });
 * ```
 */
class CliParamsModule_Class
	extends Module<Config> {

	private paramsValue: TypedMap<string | string[] | undefined> = {};

	/**
	 * Initializes the module by parsing all configured parameters.
	 * 
	 * Validates that all required (non-optional) parameters are present.
	 * Throws ImplementationMissingException if required parameters are missing.
	 * 
	 * @returns Map of parsed parameter values
	 * @throws {ImplementationMissingException} If required parameters are missing
	 */
	init() {
		this.config.params.forEach((param) => this.paramsValue[param.keyName] = this.getParam<any>(param));
		this.printHowTo(this.config.params);
		return this.paramsValue;
	}

	/**
	 * Extracts and processes a CLI parameter value.
	 * 
	 * Looks for the parameter in the provided args array (defaults to process.argv).
	 * Falls back to defaultValue if not found. Applies the process function if provided.
	 * 
	 * @param param - Parameter configuration
	 * @param args - Array of CLI arguments (defaults to process.argv.slice(2))
	 * @returns The parameter value (processed if processor is defined)
	 * @throws {BadImplementationException} If the parameter is not configured
	 */
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

	/**
	 * Extracts parameter value from CLI arguments using regex matching.
	 * 
	 * For array parameters, collects all matching values. For single parameters,
	 * returns the first match found.
	 * 
	 * @param param - Parameter configuration
	 * @param argv - Array of CLI arguments
	 * @returns Extracted value(s) or undefined
	 */
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
