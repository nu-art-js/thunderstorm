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

import {_keys} from './object-tools.js';
import {ResolvableContent, TS_Object} from './types.js';


/**
 * Matches a string against a regex pattern and returns the match result.
 *
 * Returns a match object with `input` property set to undefined if no match is found.
 *
 * @param value - String to match
 * @param reg - Regex pattern string
 * @returns Match result or object with undefined input if no match
 */
export function regexpCase(value: string, reg: string) {
	return value.match(new RegExp(reg)) || {input: undefined};
}

/**
 * Creates a filter pattern from raw filter text.
 *
 * Transforms filter text into a regex pattern that matches substrings:
 * - Trims and normalizes whitespace
 * - Escapes each character and wraps with `.*?` for substring matching
 * - Adds `.*` at the end
 *
 * @param rawFilter - Raw filter text
 * @returns Regex pattern string for substring matching
 */
export function createFilterPattern(rawFilter?: string) {
	let filter = rawFilter || '';
	filter = filter.trim();
	filter = filter.replace(/\s+/, ' ');
	filter = filter.replace(new RegExp('(.)', 'g'), '.*?$1');
	filter.length === 0 ? filter = '.*?' : filter += '.*';
	return filter;
}

/**
 * Calculates the size of a JSON-serialized object in megabytes.
 *
 * Serializes the object to JSON and calculates its byte size, then converts
 * to megabytes and rounds to 2 decimal places.
 *
 * @param data - Object to measure
 * @returns Size in megabytes (rounded to 2 decimal places)
 */
export function calculateJsonSizeMb(data: TS_Object) {
	const number = JSON.stringify(data).length / 1024 / 1024;
	return Math.round(number * 100) / 100;
}

/**
 * Stringifies an object with optional pretty-printing or selective field formatting.
 *
 * **Modes**:
 * - `pretty = false`: Standard JSON.stringify (compact)
 * - `pretty = true`: Pretty-printed JSON (2-space indent)
 * - `pretty = [keys]`: Custom formatting - only specified keys are pretty-printed
 *
 * **Note**: If `pretty` is an array, the output format is custom (not standard JSON)
 * with newlines and indentation only for specified keys.
 *
 * @template T - Object type
 * @param obj - Object or string to stringify
 * @param pretty - Pretty-print mode: boolean for all fields, or array for selective formatting
 * @returns Stringified representation
 */
export function __stringify<T extends object | string>(obj?: T, pretty?: boolean | (keyof T)[]): string {
	if (!obj)
		return '';

	if (typeof obj === 'string')
		return obj;

	if (Array.isArray(pretty))
		return `${_keys(obj as object).reduce((carry: string, key: keyof T, idx: number) => {
			return carry + `  ${String(key)}: ${__stringify(obj[key] as unknown as object, pretty.includes(key))}${idx !== _keys(obj).length - 1 && ',\n'}`;
		}, `{\n`)}\n}`;

	if (pretty)
		return JSON.stringify(obj, null, 2);

	return JSON.stringify(obj);
}

/** Frozen empty object (immutable) */
export const EmptyObject = Object.freeze({});
/** Frozen empty array (immutable) */
export const EmptyArray = Object.freeze([]);

/** Frozen async function that does nothing */
export const voidFunction = Object.freeze(async () => {
});

/** Frozen function that always returns false */
export const functionThatReturnsFalse = Object.freeze(() => false);
/** Frozen function that always returns true */
export const functionThatReturnsTrue = Object.freeze(() => true);

/**
 * Resolves content that can be either a value or a function.
 *
 * If content is a function, calls it with the provided parameters.
 * Otherwise, returns the value as-is.
 *
 * @template T - Return type
 * @template P - Parameter types
 * @param content - Value or function that returns a value
 * @param param - Parameters to pass if content is a function
 * @returns Resolved value
 */
export const resolveContent = <T = any, P extends any[] = any[]>(content: ResolvableContent<T, P>, ...param: P) => {
	return typeof content === 'function' ? (content as (...param: P) => T)(...param) : content as T;
};
/** Alias for resolveContent */
export const resolveFunctionOrValue = resolveContent;

/**
 * Type guard that checks if a value exists (is not null or undefined).
 *
 * @template T - Value type
 * @param item - Value to check
 * @returns true if item is not null or undefined
 */
export function exists<T = any>(item: T | undefined | null): item is T {
	return item !== undefined && item !== null;
}

/**
 * Freezes an object to make it immutable.
 *
 * @template T - Object type
 * @param item - Object to freeze
 * @returns Frozen (readonly) object
 */
export function freeze<T = any>(item: T): Readonly<T> {
	return Object.freeze(item);
}

/**
 * Logical XOR operation.
 *
 * Returns true if exactly one operand is true, false otherwise.
 *
 * @param a - First boolean
 * @param b - Second boolean
 * @returns true if a XOR b
 */
export const logicalXOR = (a: boolean, b: boolean) => {
	return (a && !b) || (!a && b);
};

/**
 * Type helper for binding a key name to a type.
 *
 * Useful for type-safe key-value mappings.
 */
export type KeyBinder<K extends string, Type> = { Key: K, Type: Type }

/**
 * Creates a locked async function that prevents concurrent execution.
 *
 * Returns a function that wraps the provided async function. If the function
 * is already executing, subsequent calls are ignored until the current execution
 * completes.
 *
 * **Use case**: Prevents race conditions when an async function might be called
 * multiple times before the first call completes.
 *
 * @param fn - Async function to lock
 * @returns Locked function that prevents concurrent execution
 */
export function createLockedAsyncFunction(fn: () => Promise<void>): () => void {
	let inProgress = false;
	return () => {
		if (inProgress) return;
		inProgress = true;
		Promise.resolve(fn()).finally(() => {
			inProgress = false;
		});
	};
}

/**
 * Converts a base64 data URL to a Blob.
 * @param imageAsBase64 - Data URL (e.g. "data:image/png;base64,...") or base64 string
 * @returns Promise resolving to the Blob
 */
export async function base64ToBlob(imageAsBase64: string): Promise<Blob> {
	return (await fetch(imageAsBase64)).blob();
}