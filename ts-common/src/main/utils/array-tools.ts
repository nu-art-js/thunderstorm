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

import {exists} from './tools.js';
import {_keys} from './object-tools.js';
import {NestedArrayType, TypedMap} from './types.js';
import {BadImplementationException} from '../core/exceptions/exceptions.js';


/**
 * Splits an array into two arrays based on a filter condition.
 *
 * More efficient than calling filter twice as it only iterates once, but note
 * that it still creates two new arrays. The original array is not modified.
 *
 * @param input - Array to filter
 * @param filter - Function that returns true for items to include in filteredIn
 * @returns Object with filteredIn (matching items) and filteredOut (non-matching items)
 */
export function filterInOut<T>(input: T[], filter: (object: T) => boolean): { filteredIn: T[], filteredOut: T[] } {
	return {
		filteredIn: input.filter(filter),
		filteredOut: input.filter((object: T) => !filter(object))
	};
}

/**
 * Finds and removes the first instance of an item from an array (in-place).
 *
 * Uses reference equality (===) to find the item. Only removes the first match.
 *
 * @param array - Array to modify (modified in-place)
 * @param item - Item to remove
 * @returns The modified array (same instance)
 */
export function removeItemFromArray<T>(array: T[], item: T) {
	const index = array.indexOf(item);
	return removeFromArrayByIndex(array, index);
}

/**
 * Removes the first item matching the condition from an array (in-place).
 *
 * **Important**: This modifies the array in-place by clearing it and repopulating
 * it with the filtered items. Only the first matching item is removed.
 *
 * @param array - Array to modify (modified in-place)
 * @param filter - Function that returns true for the item to remove
 * @returns The modified array (same instance)
 */
export function removeFromArray<T>(array: T[], filter: (_item: T) => boolean) {
	const kept = array.filter(x => !filter(x));
	array.length = 0;
	array.push(...kept);
	return array;
}

/**
 * Removes item from array in index
 * tested V
 */
export function removeFromArrayByIndex<T>(array: T[], index: number) {
	if (index > -1)
		array.splice(index, 1);

	return array;
}

/**
 * Swaps two elements in an array by their indices (in-place).
 *
 * @param array - Array to modify (modified in-place)
 * @param i1 - Index of first element
 * @param i2 - Index of second element
 * @returns The modified array (same instance)
 * @throws {BadImplementationException} If either index is out of bounds
 */
export function swapInArrayByIndex<T>(array: T[], i1: number, i2: number) {
	if (i1 < 0 || i1 >= array.length)
		throw new BadImplementationException(`index i1 out of bounds: ${i1}`);

	if (i2 < 0 || i2 >= array.length)
		throw new BadImplementationException(`index i2 out of bounds: ${i2}`);

	if (i1 === i2)
		return array;

	const temp = array[i1];
	array[i1] = array[i2];
	array[i2] = temp;
	return array;
}

/**
 * Deprecated
 */
export function addItemToArray<T>(array: T[], item: T) {
	array.push(item);
	return array;
}

export function addItemToArrayAtIndex<T>(array: T[], item: T, index: number) {
	array.splice(index, 0, item);
	return array;
}

export function toggleElementInArray<T>(array: T[], item: T) {
	const index = array.indexOf(item);
	if (index > -1)
		array.splice(index, 1);
	else
		array.push(item);

	return array;
}

/**
 * Filters an array using an async filter function.
 *
 * All filter operations are executed in parallel, then the results are applied
 * to create the filtered array. The original array is not modified.
 *
 * @param arr - Array to filter
 * @param filter - Async or sync function that returns a boolean or Promise<boolean>
 * @returns Promise that resolves to the filtered array
 */
export async function filterAsync<T>(arr: T[], filter: (parameter: T) => (Promise<boolean> | boolean)): Promise<T[]> {
	//const boolArray = await arr.map(item => filter(item)); changed
	const boolArray = await Promise.all(arr.map(item => filter(item)));
	return arr.filter((item, index) => boolArray[index]);
}

/**
 * builds array that holds all items that are in array1 and array2
 * problem with objects
 */
export function findDuplicates<T>(array1: T[], array2: T[]): T[] {
	return array1.filter(val => array2.indexOf(val) !== -1);
}


const defaultMapper: <T>(item: T) => any = (item) => item;

/**
 * Removes duplicate items from an array based on a key or mapper function.
 *
 * When a mapper is provided, uniqueness is determined by the mapped value.
 * For objects, you can specify a property key or a custom mapper function.
 *
 * **Note**: The implementation uses `Set.delete()` which modifies the Set.
 * This works because `delete()` returns true if the item was present, false otherwise.
 *
 * @param source - Array to deduplicate
 * @param mapper - Optional property key or function to extract uniqueness key.
 *                 If not provided, uses reference equality (Set-based deduplication).
 * @returns New array with duplicates removed (preserves first occurrence)
 */
export function filterDuplicates<T>(source: T[], mapper: (keyof T) | ((item: T) => any) = defaultMapper): T[] {
	if (defaultMapper === mapper)
		return Array.from(new Set(source));

	let _mapper: (item: T) => any;
	if (typeof mapper === 'function')
		_mapper = mapper;
	else
		_mapper = ((item: T) => item[mapper as keyof T]);

	const uniqueKeys = new Set(source.map(_mapper));
	return source.filter(item => uniqueKeys.delete(_mapper(item)));
}


/**
 * filter array of all undefined and null
 * */
export function filterInstances<T>(array?: (T | undefined | null | void)[]): T[] {
	return (array?.filter(item => exists(item)) || []) as T[];
}

/**
 * filter array of all falsy instances
 * */
export function filterFalsy<T>(array?: (T | undefined | null | void)[]): T[] {
	return (array?.filter(item => !!item) || []) as T[];
}

/**
 * Converts an array to a map/object where keys are determined by a function.
 *
 * Each array item becomes a value in the map. The key can be a single value
 * or an array of keys (in which case the same value is stored under multiple keys).
 *
 * @param array - Array to convert
 * @param getKey - Function that returns a key or array of keys for each item
 * @param map - Optional existing map to merge into (modified in-place)
 * @returns Map object with array items as values
 */
export function arrayToMap<T>(array: T[] | Readonly<T[]>, getKey: (item: T, index: number, map: TypedMap<T>) => string | number | (string | number)[], map: TypedMap<T> = {}): TypedMap<T> {
	return reduceToMap<T, T>(array, getKey, item => item, map);
}

type KeyResolver<Input, Output = Input> = (item: Input, index: number, map: {
	[k: string]: Output
}) => string | number | (string | number)[];

type Mapper<Input, Output = Input> = (item: Input, index: number, map: { [k: string]: Output }) => Output;

/**
 * Reduces an array to a map/object with custom key resolution and value mapping.
 *
 * More flexible than `arrayToMap` as it allows transforming values via the mapper.
 * Keys can be single values or arrays (for storing the same value under multiple keys).
 *
 * @param array - Array to reduce
 * @param keyResolver - Function that returns key(s) for each item
 * @param mapper - Function that transforms each item into the output value
 * @param map - Optional existing map to merge into (modified in-place)
 * @returns Map object with transformed values
 */
export function reduceToMap<Input, Output = Input>(array: (Input[] | Readonly<Input[]>), keyResolver: KeyResolver<Input, Output>, mapper: Mapper<Input, Output>, map: TypedMap<Output> = {}): TypedMap<Output> {
	return (array as (Input[])).reduce((toRet, element, index) => {
		const keys = keyResolver(element, index, toRet);
		const output = mapper(element, index, toRet);
		if (typeof keys === 'string' || typeof keys === 'number')
			toRet[keys] = output;
		else
			keys.forEach(key => toRet[key] = output);

		return toRet;
	}, map);
}

/**
 * Sorts an array by a key, array of keys, or custom mapper function.
 *
 * **Important**: This modifies the array in-place (mutates the original array).
 *
 * When multiple keys are provided, sorting is done hierarchically (first by
 * first key, then by second key, etc.). The `invert` parameter reverses the sort order.
 *
 * @param array - Array to sort (modified in-place)
 * @param map - Property key(s) or function to extract sort value. Defaults to identity.
 * @param invert - If true, sorts in descending order
 * @returns The sorted array (same instance, modified in-place)
 */
export function sortArray<T>(array: T[], map: keyof T | (keyof T)[] | ((item: T) => any) = i => i, invert = false): T[] {
	const functionMap = map;
	if (typeof functionMap === 'function') {
		const compareFn = (a: T, b: T) => {
			const _a = functionMap(a);
			const _b = functionMap(b);
			return (_a < _b ? -1 : (_a === _b ? 0 : 1)) * (invert ? -1 : 1);
		};

		return array.sort(compareFn);
	}

	let keys: (keyof T)[];
	if (!Array.isArray(map))
		keys = [map as keyof T];
	else
		keys = map;

	return keys.reduce((array, key) => {
		return sortArray<T>(array, item => item[key]);
	}, array) as T[];
}

/**
 * Processes an array in batches sequentially, applying an async action to each batch.
 *
 * Splits the array into chunks of the specified size and processes each chunk
 * one at a time (sequentially). The action can return a single value or an array
 * of values, which are all collected into the result array.
 *
 * Use this when you need to limit concurrency or process items in order.
 *
 * @param arr - Array to process
 * @param chunk - Size of each batch
 * @param action - Async function that processes a batch and returns result(s)
 * @returns Promise that resolves to an array of all results
 */
export async function batchAction<T = any, R = any>(arr: T[], chunk: number, action: (elements: T[]) => Promise<R | R[]>): Promise<R[]> {
	const result: R[] = [];
	for (let i = 0, j = arr.length; i < j; i += chunk) {
		const items: R[] | R = await action(arr.slice(i, i + chunk));
		if (Array.isArray(items))
			//addAllItemToArray(result, items);
			result.push(...items);
		else
			addItemToArray(result, items);
	}
	return result;
}

/**
 * Processes an array of promise-returning tasks sequentially.
 *
 * @typeParam T - The type of resolved value of the promises.
 * @returns A promise that resolves to an array of resolved values.
 *
 * @example
 * ```typescript
 * let tasks = [
 *     () => new Promise<number>(resolve => setTimeout(() => resolve(1), 1000)),
 *     () => new Promise<number>(resolve => setTimeout(() => resolve(2), 500)),
 *     () => new Promise<number>(resolve => setTimeout(() => resolve(3), 1500))
 * ];
 *
 * Promise_all_sequentially(tasks).then(console.log);  // [1, 2, 3]
 * ```
 * @param promises
 */
export async function Promise_all_sequentially<T>(promises: Array<() => Promise<T>>): Promise<T[]> {
	const results: T[] = [];
	for (const promise of promises) {
		results.push(await promise());
	}
	return results;
}

/**
 * Processes an array in batches in parallel, applying an async action to each batch.
 *
 * Splits the array into chunks and processes all chunks concurrently using Promise.all.
 * The action can return a single value or an array of values, which are all collected.
 *
 * Use this when you want maximum concurrency and order doesn't matter.
 *
 * @param arr - Array to process
 * @param chunk - Size of each batch
 * @param action - Async function that processes a batch and returns result(s)
 * @returns Promise that resolves to an array of all results
 */
export async function batchActionParallel<T = any, R = any>(arr: T[], chunk: number, action: (elements: T[]) => Promise<R | R[]>): Promise<R[]> {
	const promises: Promise<R>[] = [];
	for (let i = 0, j = arr.length; i < j; i += chunk) {
		addItemToArray(promises, action(arr.slice(i, i + chunk)));
	}

	const toRet: R[] = [];
	const results = await Promise.all(promises);
	for (const items of results) {
		if (Array.isArray(items))
			//addAllItemToArray(toRet, items);
			toRet.push(...items);
		else
			//addItemToArray(toRet, items);
			toRet.push(items);
	}

	return toRet;
}

/**
 * Recursively flattens a nested array structure into a single-level array.
 *
 * **Important**: The `result` parameter is modified in-place. If you don't want
 * to mutate an existing array, pass a new empty array or omit the parameter.
 *
 * @param arr - Nested array to flatten
 * @param result - Array to accumulate results into (modified in-place, defaults to new array)
 * @returns Flattened array (same instance as result parameter)
 */
export function flatArray<T extends any[], K = NestedArrayType<T>>(arr: T, result: K[] = []): K[] {
	for (let i = 0, length = arr.length; i < length; i++) {
		const value = arr[i];
		if (Array.isArray(value)) {
			flatArray(value, result);
		} else {
			result.push(value);
		}
	}
	return result;
}

export function filterFlatInstances<T extends any[], K = NestedArrayType<T>>(arr: T, result: K[] = []): Exclude<K, undefined>[] {
	return filterInstances(flatArray(arr, result)) as Exclude<K, undefined>[];
}

/**
 * Groups array items by a key extracted via a mapper function.
 *
 * Creates an array of objects, each containing a key and the array of items
 * that map to that key.
 *
 * @param arr - Array to group
 * @param mapper - Function that extracts the grouping key from each item
 * @returns Array of objects with `key` and `values` properties
 */
export function groupArrayBy<T, K extends string | number>(arr: T[], mapper: (item: T, index: number) => K): {
	key: K,
	values: T[]
}[] {
	const map = arr.reduce<{ [k in K]: T[] }>((agg, item, index) => {
		const key = mapper(item, index);
		(agg[key] || (agg[key] = [])).push(item);
		return agg;
	}, {} as { [k in K]: T[] });

	return _keys(map).map(key => ({key, values: map[key]}));
}

export function toggleInArray<T = string, K = (T extends object ? keyof T : T)>(arr: T[], item: T, mapper: (item: T) => K = item => item as unknown as K) {
	const index = arr.findIndex(_item => mapper(_item) === mapper(item));
	if (index !== -1)
		removeFromArrayByIndex(arr, index);
	else
		arr.push(item);
}

export function generateArray<T = number>(length: number, mapper: (index: number) => T = i => i as T) {
	return Array.from({length}).map((e, i) => mapper(i));
}

export function asArray<T>(toBeArray: T | T[]): T[] {
	return Array.isArray(toBeArray) ? toBeArray : [toBeArray];
}

export function asOptionalArray<T>(toBeArray?: T | T[]): T[] | undefined {
	if (!exists(toBeArray))
		return undefined;

	return asArray(toBeArray);
}

export function lastElement<T>(array: T[] | undefined) {
	return array?.[array?.length - 1];
}

export function firstElement<T>(array?: T[]) {
	return array?.[0];
}

export function arrayIncludesAny<T>(arr1: T[], arr2: T[]): boolean {
	return arr1.some(item => arr2.includes(item));
}

/**
 * Clear array instance and keep the same instance so save memory
 * This function will take any array and clear it's content completely while keeping the same instance to save memory
 * @param arr - Any array
 */
export function clearArrayInstance<T extends any[]>(arr: T): void {
	arr.length = 0;
}

/**
 * Returns true if arr1 returns the entirety of arr2
 * @param arr1
 * @param arr2
 */
export function arrayIncludesAll<T>(arr1: T[], arr2: T[]): boolean {
	return arr2.every(item => arr1.includes(item));
}

export function getMax<T>(arr: T[], mapper: (item: T) => number = (item) => item as number): T | undefined {
	const sorted = sortArray(arr, mapper, true);
	return sorted[0];
}

export function getMin<T>(arr: T[], mapper: (item: T) => number = (item) => item as number): T | undefined {
	const sorted = sortArray(arr, mapper);
	return sorted[0];
}

export function randomFromArray<T>(arr?: T[]): T | undefined {
	if (!arr?.length)
		return;

	return arr[Math.floor((Math.random() * arr.length))];
}