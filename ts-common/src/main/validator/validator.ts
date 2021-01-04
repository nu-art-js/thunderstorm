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
	BadImplementationException,
	CustomException
} from "../core/exceptions";
import {__stringify,} from "../utils/tools";
import {_keys} from "../utils/object-tools";
import {
	ArrayType,
	AuditBy,
	ObjectTS,
	RangeTimestamp
} from "../utils/types";
import {
	currentTimeMillies,
	Day
} from "..";

/*
 * ts-common is the basic building blocks of
 * all my typescript projects
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
export type ValidatorTypeResolver<K> =
	K extends any[] ? Validator<K> :
		K extends object ? TypeValidator<K> | Validator<K> :
			Validator<K> ;

export type Validator<P> = undefined | ((path: string, p?: P) => void);
export type TypeValidator<T extends ObjectTS> = { [P in keyof T]: ValidatorTypeResolver<T[P]> };

export class ValidationException
	extends CustomException {
	public path: string;
	public input?: string;

	constructor(debugMessage: string, path: string, input?: any) {
		super(ValidationException, debugMessage);
		this.path = path;
		this.input = input;
	}
}

const assertMandatory = (mandatory: boolean, path: string, input?: any) => {
	if (input !== undefined && input !== null)
		return;

	if (mandatory)
		throw new ValidationException(`Missing mandatory field: ${path}\n`, path, input);
};

export const validateExists = (mandatory = true): Validator<any> => {
	return (path: string, input?: any) => {
		assertMandatory(mandatory, path, input);
	}
};

export const validateObjectValues = <V, T = { [k: string]: V }>(validator: ValidatorTypeResolver<V>, mandatory = true): Validator<T> =>
	(path: string, input?: T) => {
		assertMandatory(mandatory, path, input);
		if (!input)
			return;


		for (const key of _keys(input)) {
			const inputValue = input[key];
			if (typeof inputValue === "object") {
				const objectValidator = validateObjectValues(validator, mandatory);
				if (!objectValidator)
					return;

				return objectValidator(`${path}/${key}`, inputValue as unknown as { [k: string]: V });
			}

			validate(inputValue as unknown as V, validator, `${path}/${key}`);
		}
	};

export const validateArray = <T extends any[], I = ArrayType<T>>(validator: ValidatorTypeResolver<I>, mandatory = true): Validator<I[]> =>
	(path, input?: I[]) => {
		assertMandatory(mandatory, path, input);
		if (!input)
			return;

		const _input = input as unknown as I[];
		for (let i = 0; i < _input.length; i++) {
			validate(_input[i], validator, `${path}/${i}`);
		}
	};

export const validateRegexp = (regexp: RegExp, mandatory = true): Validator<string> => {
	return (path: string, input?: string) => {
		assertMandatory(mandatory, path, input);
		if (!input)
			return;

		if (regexp.test(input))
			return;

		throw new ValidationException(`Input is not valid:\n  input: ${input}\n  regexp: ${regexp}\n`, path, input);
	}
};

export const validateValue = (values: string[], mandatory = true): Validator<string> => {
	return (path: string, input?: string) => {
		assertMandatory(mandatory, path, input);
		if (!input)
			return;

		if (values.includes(input))
			return;

		throw new ValidationException(`Input is not valid:\n  input: ${input}\n  options: ${__stringify(values)}\n`, path, input);
	}
};

export const validateRange = (ranges: [number, number][], mandatory = true): Validator<number> => {
	return (path: string, input?: number) => {
		assertMandatory(mandatory, path, input);
		if (!input)
			return;

		for (const range of ranges) {
			if (range[0] <= input && input <= range[1])
				return;
		}

		throw new ValidationException(`Input is not valid:\n  input: ${input}\n  regexp: ${__stringify(ranges)}\n`, path, input);
	}
};


export const validate = <T extends any>(instance: T, _validator: ValidatorTypeResolver<T>, path = "") => {
	if (!_validator)
		return;

	if (typeof _validator === "function") {
		const validator = _validator as Validator<T>;
		if (!validator)
			return;

		return validator(`${path}`, instance);
	}

	if (typeof _validator === "object") {
		if (!instance && _validator)
			throw new BadImplementationException(
				`Unexpect object at '${path}'\nif you want to ignore the validation of this object,\n add the following to your validator:\n {\n  ...\n  ${path}: undefined\n  ...\n}\n`);

		const __validator = _validator as TypeValidator<object>;
		validateObject(__validator, instance, path);
	}
};

export const validateObject = <T>(__validator: TypeValidator<object>, instance: T, path = "") => {
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
		validate(value, validator, `${path}/${key}`);
	}
};

export const isTimestampValid = (time: number, range = {min: currentTimeMillies() - 1000 * Day, max: currentTimeMillies() + 1000 * Day}): boolean => {
	return time >= range.min && time <= range.max;
};

export const auditValidator = (range?: RangeTimestamp) => (_path: string, audit?: AuditBy) => {
	if (!audit || !isTimestampValid(audit.auditAt.timestamp, range))
		throw new ValidationException('Time is not proper', _path, audit);
};
