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

import {_keys} from '../utils/object-tools.js';
import {TS_Object} from '../utils/types.js';
import {CustomException} from '../core/exceptions/exceptions.js';


/**
 * Type resolver that maps a type to its appropriate validator type.
 * 
 * Determines the validator structure based on the input type:
 * - Arrays: Use Validator for the array type
 * - Objects: Use TypeValidator (object with validators for each property) or Validator
 * - Primitives: Use Validator
 * 
 * This enables type-safe validation where the validator structure matches the data structure.
 */
export type ValidatorTypeResolver<K> =
	K extends [any] ? Validator<K> :
		K extends [any, any] ? Validator<K> :
			K extends [any, any, any] ? Validator<K> :
				K extends [any, any, any, any] ? Validator<K> :
					K extends any[] ? Validator<K> :
						K extends TS_Object ? TypeValidator<K> | Validator<K> :
							Validator<K>;

/**
 * Core validator function type.
 * 
 * Returns undefined if validation passes, or an InvalidResult if validation fails.
 * The parentObj parameter allows validators to access the parent object context.
 */
export type ValidatorImpl<P> = (p?: P, parentObj?: any) => (InvalidResult<P> | undefined);

/**
 * A validator can be a single function or an array of functions (all must pass).
 */
export type Validator<P> = ValidatorImpl<P> | ValidatorImpl<P>[];

/**
 * Type validator for objects - maps each property to its validator.
 * 
 * All properties are required (non-optional) in the validator, but the actual
 * object properties can be optional if the validator allows it (e.g., tsValidateOptional).
 */
export type TypeValidator<T extends TS_Object> = { [P in keyof T]-?: ValidatorTypeResolver<T[P]> };

export type InvalidResultObject<T> = { [K in keyof T]?: InvalidResult<T[K]> };
export type InvalidResultArray<T> = InvalidResult<T> | undefined;
export type InvalidResult<T> =
	T extends object ? InvalidResultObject<T> | string | undefined :
		T extends (infer I)[] ? (InvalidResultArray<I>[]) | string | undefined :
			string | undefined;

/**
 * Exception thrown when validation fails in strict mode.
 * 
 * Contains both the input that failed validation and the detailed validation
 * result showing what was wrong.
 * 
 * @template T - Type of the object that failed validation
 */
export class ValidationException<T>
	extends CustomException {
	/** The input object that failed validation */
	public input?: T;
	/** Detailed validation result showing validation errors */
	public result?: InvalidResult<T>;

	constructor(debugMessage: string, input?: T, result?: InvalidResult<T>, e?: Error) {
		super(ValidationException, debugMessage, e);
		this.result = result;
		this.input = input;
	}
}

const CONST_NO_ERROR = '###';

export const tsValidateExists = (mandatory = true): ValidatorImpl<any> => {
	return (input?: any) => {
		if (input !== undefined && input !== null)
			return;

		if (mandatory)
			return 'Missing mandatory field';

		return CONST_NO_ERROR;
	};
};

//
// export const tsValidateObjectValues = <V, T extends { [k: string]: V } = { [k: string]: V }>(validator: ValidatorTypeResolver<V>, mandatory = true): Validator<T> =>
// 	[tsValidateExists(mandatory), (input?: T) => {
// 		for (const key of _keys(input!)) {
// 			// Validate keys too
// 			const inputValue = input![key];
// 			if (typeof inputValue === 'object') {
// 				// not 100% sure what is going on here why not tsValidateObject(validator[key])
// 				const objectValidator = tsValidateObjectValues(validator, mandatory);
// 				if (!objectValidator)
// 					continue;
//
// 				return tsValidateResult(inputValue as { [k: string]: V }, objectValidator);
// 			}
//
// 			return tsValidateResult(inputValue as unknown as V, validator);
// 		}
// 	}];

/**
 * Validates an instance against a validator, optionally throwing on failure.
 * 
 * In strict mode (default), throws a ValidationException if validation fails.
 * In non-strict mode, returns the validation result (undefined if valid).
 * 
 * @param instance - Object to validate
 * @param _validator - Validator to use (function, array of functions, or object validator)
 * @param strict - If true, throws on validation failure. If false, returns result.
 * @returns Validation result (undefined if valid, InvalidResult if invalid)
 * @throws {ValidationException} If validation fails and strict is true
 */
export const tsValidate = <T>(instance: T | undefined, _validator: ValidatorTypeResolver<T>, strict = true): InvalidResult<T> | undefined => {
	const results = tsValidateResult(instance, _validator);

	if (results && strict) {
		console.error(results);
		throw new ValidationException(`Error validating object: `, instance, results as InvalidResult<T>);
	}

	return results;
};

/**
 * Core validation function that applies a validator to an instance.
 * 
 * Handles three validator types:
 * 1. Single function: Wraps in array and validates
 * 2. Array of functions: All must pass (short-circuits on first failure)
 * 3. Object validator: Validates each property recursively
 * 
 * **Special handling**: The constant `CONST_NO_ERROR` is used internally to
 * distinguish "optional field is missing" (not an error) from actual validation failures.
 * 
 * @param instance - Value to validate
 * @param _validator - Validator to apply
 * @param key - Optional property key (for better error messages)
 * @param strict - If true, reports unexpected keys in objects
 * @param parentInstance - Parent object (passed to validators for context)
 * @returns Validation result (undefined if valid)
 */
export const tsValidateResult = <T>(instance: T | undefined, _validator: ValidatorTypeResolver<T>, key?: keyof T, strict = true, parentInstance?: any): InvalidResult<T> | undefined => {
	if (!_validator)
		return 'No validator provided!' as InvalidResult<T>;

	const validator: ValidatorImpl<T>[] | object = typeof _validator === 'function' ? [_validator] : _validator;
	if (Array.isArray(validator)) {
		const result = (validator as ValidatorImpl<T>[]).reduce((result, __validator) => {
				return result === CONST_NO_ERROR ? result : result || __validator(instance, parentInstance);
			},
			undefined as InvalidResult<T> | undefined);
		return result !== CONST_NO_ERROR ? result : undefined;
	}

	if (typeof validator === 'object') {
		if (!instance && validator)
			return `Missing Property: The key '${String(key)}' is mandatory and did not appear in the instance.` as InvalidResult<T>;
		if (typeof instance !== 'object')
			return `Unexpected instance '${instance}'.\nExpected to receive an object, but received something else.` as InvalidResult<T>;

		const __validator = validator as TypeValidator<object>;
		return tsValidateObject(__validator, instance as object, '', strict) as InvalidResult<T>;
	}
};

/**
 * Validates an object against a TypeValidator (object with validators for each property).
 * 
 * In strict mode, also checks for unexpected keys in the instance that aren't in the validator.
 * Validates each property recursively and collects all validation errors.
 * 
 * @param __validator - Object validator mapping each property to its validator
 * @param instance - Object instance to validate
 * @param path - Current path (for nested error messages)
 * @param strict - If true, reports unexpected keys and enforces strict validation
 * @returns Object with validation errors keyed by property name, or undefined if valid
 */
export const tsValidateObject = <T extends object>(__validator: TypeValidator<T>, instance: T, path = '', strict = true): InvalidResultObject<T> | undefined => {
	const validatorKeys = _keys(__validator);
	const instanceKeys = Object.keys(instance as unknown as object);

	const result: InvalidResultObject<T> = {};
	for (const key of instanceKeys) {
		// @ts-ignore
		if (!validatorKeys.includes(key) && strict)
			// @ts-ignore
			result[key as keyof T] = `Unexpected key '${path}${key}'.\nIf you want to ignore the validation of this property,\n add the following to your validator:\n {\n  ...\n  ${key}: tsValidateOptional\n  ...\n}\n`;
	}

	for (const key of validatorKeys) {
		const value: T[keyof T] = instance[key];
		const validator = __validator[key];
		const propsResult = tsValidateResult(value as any, validator as any, key, strict, instance);
		if (propsResult && propsResult !== CONST_NO_ERROR)
			result[key as keyof T] = propsResult as InvalidResult<T[keyof T]>;
	}

	if (_keys(result).length === 0)
		return;

	return result;
};

