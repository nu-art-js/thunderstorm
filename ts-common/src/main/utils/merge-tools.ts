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


import {deepClone, filterKeys} from './object-tools.js';
import {exists} from './tools.js';
import {BadImplementationException} from '../core/exceptions/exceptions.js';

/**
 * Type helper for merged object types.
 *
 * Creates a type that represents the result of merging two object types,
 * with proper handling of overlapping and distinct keys.
 */
type MergedType<O, U> = {
	[K in keyof O & keyof U]-?: NonNullable<O[K]> & NonNullable<U[K]>;
} & {
	[K in Exclude<keyof O, keyof U>]?: O[K];
} & {
	[K in Exclude<keyof U, keyof O>]?: U[K];
};

/**
 * Type-safe version of mergeObject that preserves TypeScript types.
 *
 * @param original - Original object
 * @param override - Override object
 * @param unsafe - If true, allows merging different types (default: false)
 * @returns Merged object with proper TypeScript types
 */
export function mergeObjectTyped<Ori, Ove>(original: Ori, override: Ove, unsafe: boolean = false) {
	return mergeObject(original, override, unsafe) as MergedType<Ori, Ove>;
}

/**
 * Deep merges two objects, recursively merging nested objects.
 *
 * **Behavior**:
 * - Deep clones the original object
 * - Recursively merges nested objects
 * - Removes keys with undefined values from the result
 * - If original is null/undefined, returns a filtered clone of override
 *
 * **Note**: Arrays are not deeply merged - see `mergeArray()` for array handling.
 *
 * @param original - Original object to merge into
 * @param override - Override object (takes precedence)
 * @param unsafe - If true, allows merging different types (default: false)
 * @returns Deeply merged object
 */
export function mergeObject(original: any, override: any, unsafe: boolean = false) {
	if (original === override) {
		return override;
	}

	if (!exists(original))
		return filterKeys(override);

	const returnValue = deepClone(original);
	return Object.keys(override).reduce((obj, key) => {
		obj[key] = merge(original[key], override[key], unsafe);

		if (obj[key] === undefined)
			delete obj[key];

		return obj;
	}, returnValue);
}

/**
 * Merges two arrays.
 *
 * **Current implementation**: Simply returns the override array.
 * The commented code suggests a future implementation that would merge
 * array items based on some identifier (e.g., `id` field).
 *
 * @param original - Original array
 * @param override - Override array
 * @returns Override array (original is currently ignored)
 */
export function mergeArray(original: any[], override: any[]) {
	if (original === override) {
		return override;
	}

	// const returnValue = deepClone(original);
	// returnValue.reduce((array, value) => {
	// 	array.find((item)=>{
	// 		if()
	// 	});
	// }, returnValue as any[]);
	//
	// var result = original.filter((o1) => {
	// 	return override.some((o2) => {
	//
	// 		let originalKeys = Object.keys(o1);
	// 		originalKeys.some((key) =>)
	// 		return o1.id === o2.id; // return the ones with equal id
	// 	});
	// });

	return override;
}

/**
 * Recursively merges two values (objects, arrays, or primitives).
 *
 * **Merging rules**:
 * - If override is null/undefined, returns override
 * - If original is null/undefined, returns filtered override (if object) or override
 * - Throws if types don't match (unless `unsafe` is true)
 * - Arrays: Uses `mergeArray()` (currently returns override)
 * - Objects: Deep merges recursively
 * - Primitives: Returns override
 *
 * **Type safety**: By default, throws `BadImplementationException` if trying to merge
 * different types (e.g., object with array, string with number). Set `unsafe=true` to allow.
 *
 * @param original - Original value
 * @param override - Override value (takes precedence)
 * @param unsafe - If true, allows merging different types (default: false)
 * @returns Merged value
 * @throws BadImplementationException if types don't match and unsafe is false
 */
export function merge(original: any, override: any, unsafe: boolean = false) {
	if (!exists(override))
		return override;

	if (!exists(original))
		return typeof override === 'object' ? filterKeys(override) : override;

	if (((typeof original !== typeof override) && !unsafe) || (typeof original === 'object' && typeof override === 'object' && Array.isArray(original) !== Array.isArray(override)))
		throw new BadImplementationException(`trying to merge object of different types!! \n Original: ${JSON.stringify(original)}\n Override: ${JSON.stringify(override)}`);

	if (Array.isArray(original) && Array.isArray(override))
		return mergeArray(original, override);

	if (typeof original === 'object' && typeof override === 'object' && !Array.isArray(original) && !Array.isArray(override))
		return mergeObject(original || {}, override, unsafe);

	return override;
}
