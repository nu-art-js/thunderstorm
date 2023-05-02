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

import {exists} from './tools';
import {_keys} from './object-tools';
import {NestedArrayType} from './types';

export function filterInOut<T>(input: T[], filter: (object: T) => boolean): { filteredIn: T[], filteredOut: T[] } {
	return {
		filteredIn: input.filter(filter),
		filteredOut: input.filter((object: T) => !filter(object))
	};
}

/**
 * Finds and removes first instance of item from array
 * tested V
 */
export function removeItemFromArray<T>(array: T[], item: T) {
	const index = array.indexOf(item);
	return removeFromArrayByIndex(array, index);
}

/**
 * Removes the first item answering the condition given from array in place
 * tested V
 */
export function removeFromArray<T>(array: T[], item: (_item: T) => boolean) {
	const index = array.findIndex(item);
	return removeFromArrayByIndex(array, index);
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
 * Removes all items answering the condition given from array in place
 */
export async function filterAsync<T>(arr: T[], filter: (parameter: T) => Promise<boolean>): Promise<T[]> {
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

const defaultMapper: <T extends any>(item: T) => any = (item) => item;

/**
 remove all duplicates in array
 * */
export function filterDuplicates<T>(source: T[], mapper: (item: T) => any = defaultMapper): T[] {
	if (defaultMapper === mapper)
		return Array.from(new Set(source));

	const uniqueKeys = new Set(source.map(mapper));
	return source.filter(item => uniqueKeys.delete(mapper(item)));
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
 * receives array and builds hashmap whom keys are decided via function and values are from array
 * */
export function arrayToMap<T>(array: T[] | Readonly<T[]>, getKey: (item: T, index: number, map: { [k: string]: T }) => string | number, map: {
	[k: string]: T
} = {}): { [k: string]: T } {
	return reduceToMap<T, T>(array, getKey, item => item, map);
}

/**
 * turns array into object that is similar to hashmap
 * */
export function reduceToMap<Input, Output = Input>(array: (Input[] | Readonly<Input[]>), keyResolver: (item: Input, index: number, map: {
	[k: string]: Output
}) => string | number, mapper: (item: Input, index: number, map: { [k: string]: Output }) => Output, map: { [k: string]: Output } = {}): {
	[k: string]: Output
} {
	return (array as (Input[])).reduce((toRet, element, index) => {
		toRet[keyResolver(element, index, toRet)] = mapper(element, index, toRet);
		return toRet;
	}, map);
}

/**
 * sorts array
 * */
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
 * "splits" array into given size of chunks and then does "action" on chunk and return to array of actions on chunks +-
 * */
export async function batchAction<T extends any = any, R extends any = any>(arr: T[], chunk: number, action: (elements: T[]) => Promise<R | R[]>): Promise<R[]> {
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

export async function batchActionParallel<T extends any = any, R extends any = any>(arr: T[], chunk: number, action: (elements: T[]) => Promise<R | R[]>): Promise<R[]> {
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
 * Returns a flat array from an array of arrays.
 * @param arr An array that is potentially a matrix
 * @param result A flat array of single values
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

export function groupArrayBy<T extends object, K extends string | number>(arr: T[], mapper: (item: T, index: number) => K): { key: K, values: T[] }[] {
	const map = arr.reduce<{ [k in K]: T[] }>((agg, item, index) => {
		const key = mapper(item, index);
		(agg[key] || (agg[key] = [])).push(item);
		return agg;
	}, {} as { [k in K]: T[] });

	return _keys(map).map(key => ({key, values: map[key]}));
}

export function toggleInArray<T extends any = string, K extends any = (T extends object ? keyof T : T)>(arr: T[], item: T, mapper: (item: T) => K = item => item as unknown as K) {
	const index = arr.findIndex(_item => mapper(_item) === mapper(item));
	if (index !== -1)
		removeFromArrayByIndex(arr, index);
	else
		arr.push(item);
}

