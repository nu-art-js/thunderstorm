/*
 * ts-common is the basic building blocks of our typescript projects
 *
 * Copyright (C) 2020 Intuition Robotics
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

import {
	AssertionException,
	BadImplementationException
} from "../index";


export function deepClone<T>(obj: T): T {
	if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean' || typeof obj === 'undefined' || obj === null)
		return obj;

	if (Array.isArray(obj))
		return cloneArr(obj as unknown as any[]) as unknown as T;

	return cloneObj(obj as unknown as object) as unknown as T;
}

export function _keys<T extends { [k: string]: any }, K extends keyof T>(instance: T): K[] {
	return Object.keys(instance) as K[];
}

export function _values<T extends object = object>(object: T): (T[keyof T])[] {
	return Object.values(object) as (T[keyof T])[]
}

export function _setTypedProp<T extends object>(instance: T, key: keyof T, value: T[keyof T]) {
	instance[key] = value;
}

export function cloneArr<T>(value: T[]): T[] {
	return value.map(a => deepClone(a));
}

export function cloneObj<T extends object>(obj: T): T {
	return _keys(obj).reduce(<K extends keyof T>(carry: T, key: K) => {
		carry[key] = deepClone(obj[key]);
		return carry
	}, {} as T)
}

export function compare<T extends any>(one?: T, two?: T, keys?: (keyof T)[]): boolean {
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

	if (typeofOne === "function")
		throw new BadImplementationException("This compare meant to compare two POJOs.. nothing more");

	if (typeofOne !== "object")
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
