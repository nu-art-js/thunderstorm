/*
 * cli-params provides type-safe CLI parameter resolution and parsing
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

import {Primitive, TypeOfTypeAsString} from '@nu-art/ts-common';

export type CliParams<T extends BaseCliParam<string, any>[]> = {
	[K in T[number]['keyName']]: NonNullable<Extract<T[number], { keyName: K }>['defaultValue']>
}

export type DependencyParam<T extends Primitive | Primitive[]> = {
	param: BaseCliParam<string, T>,
	value: T | ((currentValue: any) => T)
}


/**
 * Base CLI parameter definition (before processing).
 * 
 * Defines a command-line parameter with keys, type, and optional features.
 * Can be incomplete (missing name/process) and will be filled by CLIParamsResolver.
 * 
 * **Features**:
 * - Multiple keys (aliases): `['--help', '-h']`
 * - Type validation: `'string'`, `'number'`, `'boolean'`, `'string[]'`, etc.
 * - Options validation: Restrict values to specific options
 * - Dependencies: Set other params based on this param's value
 * - Array support: Collect multiple values
 * 
 * @template K - Key name type (string literal)
 * @template V - Value type (primitive or array)
 */
export type BaseCliParam<K extends string, V extends Primitive | Primitive[]> = {
	/** Array of CLI keys/aliases (e.g., `['--help', '-h']`) */
	keys: string[];
	/** Unique key name for the resolved object */
	keyName: K;
	/** Type string representation (e.g., `'string'`, `'number[]'`) */
	type: TypeOfTypeAsString<V>;
	/** Human-readable description */
	description: string;
	/** Optional parameter name (defaults to keyName) */
	name?: string;
	/** Optional array of allowed values (validates input) */
	options?: string[];
	/** Initial value if param not provided */
	initialValue?: V;
	/** Default value if param provided but empty */
	defaultValue?: V;
	/** Optional processor function (defaults by type) */
	process?: (value?: string, defaultValue?: V) => V;
	/** Whether this param accepts multiple values (array) */
	isArray?: true;
	/** Optional grouping for help/validation */
	group?: string;
	/** Parameters that depend on this one */
	dependencies?: DependencyParam<any>[]
}

export type CliParam<K extends string, V extends Primitive | Primitive[]> = BaseCliParam<K, V> & {
	name: string;
	process: (value?: string, defaultValue?: V) => V;
}