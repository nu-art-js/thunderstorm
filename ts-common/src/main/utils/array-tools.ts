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

import {cloneArr} from './object-tools';

export function removeItemFromArray<T>(array: T[], item: T) {
	const index = array.indexOf(item);
	return removeFromArrayByIndex(array, index);
}

export function removeFromArray<T>(array: T[], item: (_item: T) => boolean) {
	const index = array.findIndex(item);
	return removeFromArrayByIndex(array, index);
}

export function removeFromArrayByIndex<T>(array: T[], index: number) {
	if (index > -1)
		array.splice(index, 1);

	return array;
}

export function addAllItemToArray<T>(array: T[], items: T[]) {
	array.push(...items);
	return array;
}

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

export async function filterAsync<T>(arr: T[], filter: (parameter: T) => Promise<boolean>): Promise<T[]> {
	const boolArray = await arr.map(item => filter(item));
	return arr.filter((item, index) => boolArray[index]);
}

export function findDuplicates<T>(array1: T[], array2: T[]): T[] {
	return array1.filter(val => array2.indexOf(val) !== -1);
}

const defaultMapper: <T extends any>(item: T) => any = (item) => item;

export function filterDuplicates<T>(source: T[], mapper: (item: T) => any = defaultMapper): T[] {
	if (defaultMapper === mapper)
		return Array.from(new Set(source));

	const uniqueKeys = new Set(source.map(mapper));
	return source.filter(item => uniqueKeys.delete(mapper(item)));
}

export function filterInstances<T>(array?: (T | undefined | null | void)[]): T[] {
	return (array?.filter(item => !!item) || []) as T[];
}

export function arrayToMap<T>(array: T[] | Readonly<T[]>, getKey: (item: T, index: number, map: { [k: string]: T }) => string | number, map: { [k: string]: T } = {}): { [k: string]: T } {
	return reduceToMap<T, T>(array, getKey, item => item, map);
}

export function reduceToMap<Input, Output = Input>(array: (Input[] | Readonly<Input[]>),
																									 keyResolver: (item: Input, index: number, map: { [k: string]: Output }) => string | number,
																									 mapper: (item: Input, index: number, map: { [k: string]: Output }) => Output,
																									 map: { [k: string]: Output } = {}): { [k: string]: Output } {
	return (array as (Input[])).reduce((toRet, element, index) => {
		toRet[keyResolver(element, index, toRet)] = mapper(element, index, toRet);
		return toRet;
	}, map);
}

export function sortArray<T>(array: T[] | ReadonlyArray<T>, map: keyof T | (keyof T)[] | ((item: T) => any) = i => i, invert = false): T[] {
	const functionMap = map;
	if (typeof functionMap === 'function') {
		const compareFn = (a: T, b: T) => {
			const _a = functionMap(a);
			const _b = functionMap(b);
			return (_a < _b ? -1 : (_a === _b ? 0 : 1)) * (invert ? -1 : 1);
		};

		let _array;
		if ('sort' in array)
			_array = cloneArr(array as T[]);
		else
			_array = array;
		return (_array as T[]).sort(compareFn);
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

export async function batchAction<T extends any = any, R extends any = any>(arr: T[], chunk: number, action: (elements: T[]) => Promise<R | R[]>): Promise<R[]> {
	const result: R[] = [];
	for (let i = 0, j = arr.length; i < j; i += chunk) {
		const items: R[] | R = await action(arr.slice(i, i + chunk));
		if (Array.isArray(items))
			addAllItemToArray(result, items);
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
			addAllItemToArray(toRet, items);
		else
			addItemToArray(toRet, items);
	}

	return toRet;
}

/**
 * Returns a flat array from an array of arrays.
 * @param arr An array that is potentially a matrix
 * @param result A flat array of single values
 */
export function flatArray<T>(arr: T[][] | T[], result: T[] = []): T[] {
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
