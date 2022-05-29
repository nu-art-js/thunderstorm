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

import {BadImplementationException, CustomException} from '../core/exceptions';
import {__stringify,} from '../utils/tools';
import {_keys} from '../utils/object-tools';
import {ArrayType, AuditBy, RangeTimestamp, TS_Object} from '../utils/types';
import {currentTimeMillis} from '..';

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

export type Validator<P> = undefined | ((path: string, p?: P) => void);
export type TypeValidator<T extends TS_Object> = { [P in keyof T]: ValidatorTypeResolver<T[P]> };

export class ValidationException
	extends CustomException {
	public path: string;
	public input?: string;

	constructor(debugMessage: string, path: string, input?: any, e?: Error) {
		super(ValidationException, debugMessage, e);
		this.path = path;
		this.input = input;
	}
}

export const assertValidateMandatoryProperty = (mandatory: boolean, path: string, input?: any) => {
	if (input !== undefined && input !== null)
		return;

	if (mandatory)
		throw new ValidationException(`Missing mandatory field: ${path}\n`, path, input);
};

export const tsValidateExists = (mandatory = true): Validator<any> => {
	return (path: string, input?: any) => {
		assertValidateMandatoryProperty(mandatory, path, input);
	};
};

export const tsValidateObjectValues = <V, T = { [k: string]: V }>(validator: ValidatorTypeResolver<V>, mandatory = true): Validator<T> =>
	(path: string, input?: T) => {
		assertValidateMandatoryProperty(mandatory, path, input);
		if (!input)
			return;

		for (const key of _keys(input)) {
			const inputValue = input[key];
			if (typeof inputValue === 'object') {
				const objectValidator = tsValidateObjectValues(validator, mandatory);
				if (!objectValidator)
					return;

				return objectValidator(`${path}/${String(key)}`, inputValue as unknown as { [k: string]: V });
			}

			tsValidate(inputValue as unknown as V, validator, `${path}/${String(key)}`);
		}
	};

export const tsValidateArray = <T extends any[], I = ArrayType<T>>(validator: ValidatorTypeResolver<I>, mandatory = true): Validator<I[]> =>
	(path, input?: I[]) => {
		assertValidateMandatoryProperty(mandatory, path, input);
		if (!input)
			return;

		const _input = input as unknown as I[];
		for (let i = 0; i < _input.length; i++) {
			tsValidate(_input[i], validator, `${path}/${i}`);
		}
	};

export const tsValidateMD5 = (mandatory = true): Validator<string> => {
	return tsValidateRegexp(/[a-zA-Z\d]{32}/, mandatory);
};

export const tsValidateRegexp = (regexp: RegExp, mandatory = true): Validator<string> => {
	return (path: string, input?: string) => {
		assertValidateMandatoryProperty(mandatory, path, input);
		if (input === undefined)
			return;

		if (regexp.test(input))
			return;

		throw new ValidationException(`Input does not match regexp for path(${path}):\n  input: ${input}\n  regexp: ${regexp}\n`, path, input);
	};
};

export const tsValidateNumber = (mandatory = true): Validator<number> => {
	return (path: string, input?: number) => {
		assertValidateMandatoryProperty(mandatory, path, input);
		if (input === undefined)
			return;

		// noinspection SuspiciousTypeOfGuard
		if (typeof input === 'number')
			return;

		throw new ValidationException(`Input is not a number for path(${path})! \nvalue: ${input}\ntype: ${typeof input}`, path, input);
	};
};

export const tsValidateBoolean = (mandatory = true): Validator<boolean> => {
	return (path: string, input?: boolean) => {
		assertValidateMandatoryProperty(mandatory, path, input);
		if (input === undefined)
			return;

		// noinspection SuspiciousTypeOfGuard
		if (typeof input === 'boolean')
			return;

		throw new ValidationException(`input is not a boolean! \nvalue: ${input}\ntype: ${typeof input}`, path, input);
	};
};

export const tsValidateValue = (values: string[], mandatory = true): Validator<string> => {
	return (path: string, input?: string) => {
		assertValidateMandatoryProperty(mandatory, path, input);
		if (!input)
			return;

		if (values.includes(input))
			return;

		throw new ValidationException(`Input is not valid:\n  input: ${input}\n  options: ${__stringify(values)}\n`, path, input);
	};
};

export const tsValidateRange = (ranges: [number, number][], mandatory = true): Validator<number> => {
	return (path: string, input?: number) => {
		assertValidateMandatoryProperty(mandatory, path, input);
		if (!input)
			return;

		for (const range of ranges) {
			if (range[0] <= input && input <= range[1])
				return;
		}

		throw new ValidationException(`Input is not valid:\n  input: ${input}\n  Expected Range: ${__stringify(ranges)}\n`, path, input);
	};
};

export const tsValidate = <T extends any>(instance: T | undefined, _validator: ValidatorTypeResolver<T>, path = '', mandatory: boolean | Partial<T> = {}) => {
	if (!_validator)
		return;

	if (typeof _validator === 'function') {
		const validator = _validator as Validator<T>;
		if (!validator)
			return;

		return validator(`${path}`, instance);
	}

	if (typeof _validator === 'object') {
		if (!instance && _validator)
			throw new BadImplementationException(
				`Unexpect object at '${path}'\nif you want to ignore the validation of this object,\n add the following to your validator:\n {\n  ...\n  ${path}: undefined\n  ...\n}\n`);

		const __validator = _validator as TypeValidator<object>;
		tsValidateObject(__validator, instance, path);
	}
};

export const tsValidateObject = <T>(__validator: TypeValidator<object>, instance: T, path = '') => {
	const validatorKeys = _keys(__validator);
	const instanceKeys = Object.keys(instance as unknown as object);

	for (const key of instanceKeys) {
		// @ts-ignore
		if (!validatorKeys.includes(key))
			throw new BadImplementationException(
				`Unexpect key '${path}${key}'\nif you want to ignore the validation of this property,\n add the following to your validator:\n {\n  ...\n  ${key}: undefined\n  ...\n}\n`);
	}

	for (const key of validatorKeys) {
		const value: T[keyof T] = instance[key];
		const validator = __validator[key];
		tsValidate(value, validator, `${path}/${key}`);
	}
};

export const tsValidateTimestamp = (interval?: number, mandatory = true): Validator<number> => {
	return (path: string, input?: number) => {
		assertValidateMandatoryProperty(mandatory, path, input);
		if (input === undefined)
			return;

		const now = currentTimeMillis();
		const minTimestamp = now - (interval || now);
		if (minTimestamp <= input && input <= now)
			return;

		throw new ValidationException(`Input is not valid:\n  input: ${input}\n  Expected Interval: ${minTimestamp} - ${now}\n`, path, input);
	};
};

export const tsValidateAudit = (range?: RangeTimestamp) => (_path: string, audit?: AuditBy) => {
	tsValidateRange([[0, Number.MAX_VALUE]], true)?.(_path, audit?.auditAt?.timestamp);
};
