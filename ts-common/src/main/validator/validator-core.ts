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

import {_keys} from '../utils/object-tools';
import {TS_Object} from '../utils/types';
import {CustomException} from '../core/exceptions/exceptions';


/**
 * Should be like the following but errors in resolving...
 *
 * 	K extends [infer E1] ? [Validator<E1>[]] :
 * 		K extends [infer E1, infer E2] ? [Validator<E1>,Validator<E2>] :
 * 			K extends [infer E1, infer E2, infer E3] ? [Validator<E1>,Validator<E2>,Validator<E2>] :
 * 				K extends [infer E1, infer E2, infer E3, infer E4] ? [Validator<E1>,Validator<E2>,Validator<E2>,Validator<E4>] :
 */
export type ValidatorTypeResolver<K> =
	K extends [any] ? Validator<K> :
		K extends [any, any] ? Validator<K> :
			K extends [any, any, any] ? Validator<K> :
				K extends [any, any, any, any] ? Validator<K> :
					K extends any[] ? Validator<K> :
						K extends TS_Object ? TypeValidator<K> | Validator<K> :
							Validator<K>;

export type ValidatorImpl<P> = (p?: P, parentObj?: any) => (InvalidResult<P> | undefined);
export type Validator<P> = ValidatorImpl<P> | ValidatorImpl<P>[];
export type TypeValidator<T extends TS_Object> = { [P in keyof T]-?: ValidatorTypeResolver<T[P]> };

export type InvalidResultObject<T> = { [K in keyof T]?: InvalidResult<T[K]> };
export type InvalidResultArray<T> = InvalidResult<T> | undefined;
export type InvalidResult<T> =
	T extends object ? InvalidResultObject<T> | string | undefined :
		T extends (infer I)[] ? (InvalidResultArray<I>[]) | string | undefined :
			string | undefined;

export class ValidationException<T>
	extends CustomException {
	public input?: T;
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

export const tsValidate = <T>(instance: T | undefined, _validator: ValidatorTypeResolver<T>, strict = true): InvalidResult<T> | undefined => {
	const results = tsValidateResult(instance, _validator);

	if (results && strict) {
		console.error(results);
		throw new ValidationException(`Error validating object: `, instance, results as InvalidResult<T>);
	}

	return results;
};

export const tsValidateResult = <T>(instance: T | undefined, _validator: ValidatorTypeResolver<T>, key?: keyof T, parentInstance?: any): InvalidResult<T> | undefined => {
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
		return tsValidateObject(__validator, instance as object) as InvalidResult<T>;
	}
};

export const tsValidateObject = <T extends object>(__validator: TypeValidator<T>, instance: T, path = ''): InvalidResultObject<T> | undefined => {
	const validatorKeys = _keys(__validator);
	const instanceKeys = Object.keys(instance as unknown as object);

	const result: InvalidResultObject<T> = {};
	for (const key of instanceKeys) {
		// @ts-ignore
		if (!validatorKeys.includes(key))
			// @ts-ignore
			result[key as keyof T] = `Unexpected key '${path}${key}'.\nIf you want to ignore the validation of this property,\n add the following to your validator:\n {\n  ...\n  ${key}: tsValidateOptional\n  ...\n}\n`;
	}

	for (const key of validatorKeys) {
		const value: T[keyof T] = instance[key];
		const validator = __validator[key];
		const propsResult = tsValidateResult(value as any, validator as any, key, instance);
		if (propsResult && propsResult !== CONST_NO_ERROR)
			result[key as keyof T] = propsResult as InvalidResult<T[keyof T]>;
	}

	if (_keys(result).length === 0)
		return;

	return result;
};

