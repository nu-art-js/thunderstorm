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

import {DotNotation, TS_Object, TypedMap} from './types.js';
import {AssertionException, BadImplementationException} from '../core/exceptions/exceptions.js';
import {asArray, sortArray} from './array-tools.js';
import {merge} from './merge-tools.js';
import {exists} from './tools.js';

export function getDotNotatedValue<T extends object>(key: DotNotation<T>, dotNotatedObject: T) {
	const pathParts = key.split('.');
	return pathParts.reduce((value: any, _pathPart: string) => {
		return value[_pathPart];
	}, dotNotatedObject);
}

export function deepClone<T>(obj: T | Readonly<T>): T {
	if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean' || typeof obj === 'undefined' || obj === null)
		return obj;

	if (Array.isArray(obj))
		return cloneArr(obj as unknown as any[]) as unknown as T;

	return cloneObj(obj as unknown as object) as unknown as T;
}

export function _keys<T extends { [k: string]: any }, K extends keyof T>(instance: T): K[] {
	return Object.keys(instance) as K[];
}

export function _values<T extends TS_Object = TS_Object>(object: T): (T[keyof T])[] {
	return Object.values(object) as (T[keyof T])[];
}

export function _entries<T extends TS_Object = TS_Object, K extends keyof T = keyof T>(obj: T): { key: K, value: T[K] }[] {
	return Object.entries(obj).map(entry => ({key: entry[0], value: entry[1]} as { key: K, value: T[K] }));
}

export function sortObject<T extends TS_Object = TS_Object>(obj: T, sortFunction?: ((key: keyof T) => any)): T {
	return sortArray(_keys(obj), sortFunction).reduce((toRet, key) => {
		toRet[key] = obj[key];
		return toRet;
	}, {} as T);
}

export function _setTypedProp<T extends TS_Object>(instance: T, key: keyof T, value: T[keyof T]) {
	instance[key] = value;
}

export function cloneArr<T>(value: T[]): T[] {
	return value.map(a => deepClone(a));
}

export function cloneObj<T extends TS_Object>(obj: T): T {
	return _keys(obj).reduce(<K extends keyof T>(carry: T, key: K) => {
		carry[key] = deepClone(obj[key]);
		return carry;
	}, {} as T);
}

export function partialCompare<T>(one?: T, two?: T, keysToFilterOut?: (keyof T)[]): boolean {
	one = deepClone(one);
	two = deepClone(two);

	keysToFilterOut?.forEach(key => {
		delete one?.[key];
		delete two?.[key];
	});

	return compare(one, two);
}

/**
 * Returns true for equal.
 */
export function compare<T>(one?: T, two?: T, keys?: (keyof T)[]): boolean {
	const typeofOne = typeof one;
	const typeofTwo = typeof two;

	if (typeofOne !== typeofTwo)
		return false;

	if (one === undefined && two === undefined)
		return true;

	if (one === undefined || two === undefined)
		return false;

	if (one === null && two === null)
		return true;

	if (one === null || two === null)
		return false;

	if (typeofOne === 'function')
		throw new BadImplementationException('This compare meant to compare two POJOs.. nothing more');

	if (typeofOne !== 'object')
		return one === two;

	if (Array.isArray(one) && Array.isArray(two)) {
		if (one.length !== two.length)
			return false;

		for (let i = 0; i < one.length; i++) {
			if (compare(one[i], two[i]))
				continue;

			return false;
		}

		return true;
	}
	const _one = one as { [k: string]: any };
	const _two = two as { [k: string]: any };
	const oneKeys = keys as string[] || Object.keys(_one);
	const twoKeys = keys as string[] || Object.keys(_two);
	if (oneKeys.length !== twoKeys.length)
		return false;

	for (const oneKey of oneKeys) {
		if (!twoKeys.includes(oneKey))
			return false;
	}

	for (const oneKey of oneKeys) {
		if (compare(_one[oneKey], _two[oneKey]))
			continue;

		return false;
	}

	return true;
}

export function assert<T>(message: string, expected: T, actual: T) {
	if (!compare(expected, actual))
		throw new AssertionException(
			`Assertion Failed:\n  -- ${message}\n  -- Expected: ${JSON.stringify(expected)}\n  --   Actual: ${JSON.stringify(actual)}\n\n`);
}

export function filterKeys<T extends TS_Object = TS_Object>(obj: T, keys: keyof T | (keyof T)[] = _keys(obj), filter: (k: keyof T, obj: T) => boolean = (k) => obj[k] === undefined || obj[k] === null) {
	if (typeof obj !== 'object' || obj === null) {
		throw new BadImplementationException('Passed parameter for "obj" must be an object');
	}

	asArray(keys).forEach(key => {
		if (filter(key, obj))
			delete obj[key];
	});

	return obj;
}


export type ScrubConfig = {
	emptyObjects: boolean,
	emptyArrays: boolean,
	emptyStrings: boolean,
	returnCopy: boolean;
}

const defaultScrubConfig: ScrubConfig = {
	emptyObjects: false,
	emptyArrays: false,
	emptyStrings: false,
	returnCopy: true
};

export function scrub<T>(item: T, config: Partial<ScrubConfig> = {}): T | undefined {
	config = merge(defaultScrubConfig, config);
	return scrubImpl(item, config as ScrubConfig);
}

function scrubImpl<T>(item: T, config: ScrubConfig): T | undefined {
	//Quick exit if item does not exist
	if (!exists(item))
		return;

	//Item is a boolean - always return it
	if (typeof item === 'boolean' || typeof item === 'number')
		return item;

	//Item is a string
	if (typeof item === 'string') {
		//return undefined if the item is an empty string and we are scrubbing those
		return (!item.length && config.emptyStrings) ? undefined : item;
	}

	//Item is an object
	if (typeof item === 'object') {
		if (Array.isArray(item)) { //ITEM IS AN ARRAY
			const arr = config.returnCopy ? cloneArr(item) : item;
			//Scrub each value in the array
			arr.forEach((val, i) => arr[i] = scrubImpl(val, config));
			//Remove any item that returned as undefined
			const filtered = arr.filter(item => !!item);
			filtered.forEach((val, i) => arr[i] = val);
			arr.length = filtered.length;
			//Return undefined if scrubbing empty arrays
			return (arr.length === 0 && config.emptyArrays) ? undefined : arr as T;
		} else { //ITEM IS AN OBJECT
			const obj = (config.returnCopy ? cloneObj(item as object) : item) as T;
			const keys = _keys(obj as object) as (keyof T)[];
			//Scrub each property on the object
			keys.forEach(key => {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				obj[key] = scrubImpl(obj[key], config)!;
				if (!exists(obj[key]))
					delete obj[key];
			});

			//Return undefined if scrubbing empty objects
			return (_keys(obj as object).length === 0 && config.emptyObjects) ? undefined : obj;
		}
	}
}

export function reduceObject<ACC, T extends TypedMap<any>>(object: T, acc: ACC, reducer: <K extends keyof T>(acc: ACC, key: K, value: T[K]) => ACC) {
	return _keys(object).reduce((accumulator, key) => {
		const typedKey = key as keyof T;
		return reducer(accumulator, typedKey, object[typedKey]);
	}, acc);
}


export function deepFreeze<T>(object: T): T {
	if (object === null || typeof object !== 'object')
		return object;

	// Freeze each property before freezing self
	for (const key of Object.getOwnPropertyNames(object)) {
		const value = (object as any)[key];

		if (typeof value === 'object' && value !== null && !Object.isFrozen(value))
			deepFreeze(value);
	}

	return Object.freeze(object);
}

