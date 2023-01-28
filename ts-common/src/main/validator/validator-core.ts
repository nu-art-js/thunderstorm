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

import {CustomException} from '../core/exceptions';
import {_keys} from '../utils/object-tools';
import {TS_Object} from '../utils/types';

/*
 * ts-common is the basic building blocks of
 * all my typescript projects
 *
 * Copyright (C) 2018  Adam van der Kruk aka TacB0sS
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
export type ValidatorTypeResolver<K> =
	K extends any[] ? Validator<K> :
		K extends TS_Object ? TypeValidator<K> | Validator<K> :
			Validator<K>;

export type ValidatorImpl<P> = (p?: P) => (InvalidResult<P> | undefined);
export type Validator<P> =  ValidatorImpl<P> | ValidatorImpl<P>[];
export type TypeValidator<T extends TS_Object> = { [P in keyof T]-?: ValidatorTypeResolver<T[P]> };

export type InvalidResultObject<T extends any> = { [K in keyof T]?: InvalidResult<T[K]> };
export type InvalidResultArray<T extends any> = InvalidResult<T> | undefined;
export type InvalidResult<T extends any> =
	T extends object ? InvalidResultObject<T> | string :
		T extends (infer I)[] ? (InvalidResultArray<I>[]) | string :
			string;

export class ValidationException
	extends CustomException {
	public input?: string;
	public result?: InvalidResult<any>;

	constructor(debugMessage: string, input?: any, result?: InvalidResult<any>, e?: Error) {
		super(ValidationException, debugMessage, e);
		this.result = result;
		this.input = input;
	}
}

const CONST_NO_ERROR = '###';

export const assertValidateMandatoryProperty = (mandatory: boolean, input?: any) => {
};

export const tsValidateExists = (mandatory = true): ValidatorImpl<any> => {
	return (input?: any) => {
		if (input !== undefined && input !== null)
			return;

		if (mandatory)
			return 'Missing mandatory field';

		return CONST_NO_ERROR;
	};
};

export const tsValidateMustExist = tsValidateExists();
export const tsValidateOptional = tsValidateExists(false);

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

export const tsValidate = <T extends any>(instance: T | undefined, _validator: ValidatorTypeResolver<T>, strict = true) => {
	const results = tsValidateResult(instance, _validator);

	if (results && strict) {
		console.error(results);
		throw new ValidationException(`Error validating object: `, instance, results);
	}

	return results;
};

export const tsValidateResult = <T extends any>(instance: T | undefined, _validator: ValidatorTypeResolver<T>, key?: keyof T) => {
	if (!_validator)
		return;

	const validator: ValidatorImpl<T>[] | object = typeof _validator === 'function' ? [_validator] : _validator;
	if (Array.isArray(validator)) {
		const result = validator.reduce((result, __validator) => result === CONST_NO_ERROR ? result : result || __validator(instance), undefined as InvalidResult<T> | undefined);
		return result !== CONST_NO_ERROR ? result : undefined;
	}

	if (typeof validator === 'object') {
		if (!instance && validator)
			return `Unexpected object:\n The key '${String(key)}' wasn't defined in the instance.`;
		if (typeof instance !== 'object')
			return `Unexpected instance '${instance}'.\nExpected to receive an object, but received something else.`;

		const __validator = validator as TypeValidator<object>;
		return tsValidateObject(__validator, instance);
	}
};

export const tsValidateObject = <T>(__validator: TypeValidator<object>, instance: T, path = '') => {
	const validatorKeys = _keys(__validator);
	const instanceKeys = Object.keys(instance as unknown as object);

	const result: InvalidResultObject<T> = {};
	for (const key of instanceKeys) {
		// @ts-ignore
		if (!validatorKeys.includes(key))
			// @ts-ignore
			result[key as keyof T] = `Unexpected key '${path}${key}'.\nIf you want to ignore the validation of this property,\n add the following to your validator:\n {\n  ...\n  ${key}: undefined\n  ...\n}\n`;
	}

	for (const key of validatorKeys) {
		const value: T[keyof T] = instance[key];
		const validator = __validator[key];
		const propsResult = tsValidateResult(value, validator, key);
		if (propsResult && propsResult !== CONST_NO_ERROR)
			result[key as keyof T] = propsResult;
	}

	if (_keys(result).length === 0)
		return;

	return result;
};