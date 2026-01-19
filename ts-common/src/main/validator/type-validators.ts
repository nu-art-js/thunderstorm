import {__stringify, exists} from '../utils/tools.js';
import {InvalidResult, InvalidResultArray, InvalidResultObject, tsValidateExists, tsValidateResult, Validator, ValidatorTypeResolver} from './validator-core.js';
import {currentTimeMillis, TimeRange} from '../utils/date-time-tools.js';
import {ArrayType, AuditBy, RangeTimestamp, TypedMap} from '../utils/types.js';
import {asArray, filterInstances} from '../utils/array-tools.js';
import {_keys} from '../utils/object-tools.js';
import {BadImplementationException} from '../core/exceptions/exceptions.js';


/**
 * Validates a dynamic object where both keys and values are validated.
 * 
 * Validates each key-value pair in the object using separate validators.
 * Returns an object with validation errors keyed by the object's keys.
 * 
 * **Error aggregation**: If both key and value fail validation, combines both errors.
 * If only one fails, reports that specific error.
 * 
 * @template T - Object type to validate
 * @param valuesValidator - Validator for object values
 * @param keysValidator - Validator for object keys
 * @param mandatory - Whether the object itself is required (default: true)
 * @returns Validator that validates both keys and values
 */
export const tsValidateDynamicObject = <T extends object>(valuesValidator: ValidatorTypeResolver<T[keyof T]>, keysValidator: ValidatorTypeResolver<string>, mandatory = true) => {
	return [tsValidateExists(mandatory),
					(input?: T) => {
						if (!input)
							return;

						const keys = _keys(input) as string[];
						const _result = keys.reduce<InvalidResultObject<T>>((res, key) => {
							const _valRes = tsValidateResult(input[key as keyof T], valuesValidator);
							const _keyRes = tsValidateResult(key, keysValidator);

							if (_valRes && _keyRes)
								res[key as keyof T] = `Key: ${_keyRes}\nValue: ${_valRes}` as InvalidResult<T[keyof T]>;
							else if (_valRes)
								res[key as keyof T] = 'Value: ' + __stringify(_valRes, true) as InvalidResult<T[keyof T]>;
							else if (_keyRes)
								res[key as keyof T] = 'Key: ' + __stringify(_keyRes, true) as InvalidResult<T[keyof T]>;

							return res;
						}, {});
						return _keys(_result).length ? _result : undefined;
					}];
};

/**
 * Validates input against multiple validators (union type).
 * 
 * The input must pass at least one of the provided validators. If all validators
 * fail, returns an array with an error message and all validation results.
 * 
 * **Early exit**: Returns undefined (valid) as soon as one validator passes.
 * 
 * @template T - Type to validate
 * @param validators - Array of validators to try
 * @param mandatory - Whether input is required (default: true)
 * @returns Validator that tries each validator until one passes
 */
export const tsValidateUnion = <T>(validators: ValidatorTypeResolver<T>[], mandatory = true) => {
	return [tsValidateExists(mandatory),
					(input?: any) => {
						const results: InvalidResultArray<T>[] = [];
						for (const validator of validators) {
							const _res = tsValidateResult(input, validator);
							if (!_res)
								return;
							results.push(_res as InvalidResultArray<T>);
						}

						return filterInstances(results).length !== 0 ? ['Input does not match any of the possible types',
																														results] as InvalidResultArray<T>[] : undefined;
					}];
};

export const tsValidateCustom = <T>(processor: (input?: T, parentInput?: any) => InvalidResult<T>, mandatory = true): Validator<T>[] => {
	return [tsValidateExists(mandatory), processor];
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const typeFunc = (type: any) => typeof type;
type types = ReturnType<typeof typeFunc>;
type validatorObject<T> = { [k in types]?: ValidatorTypeResolver<T> }
export const tsValidateUnionV3 = <T>(validatorObject: validatorObject<T>, mandatory = true) => {
	return [tsValidateExists(mandatory),
					(input?: T) => {
						const _type = typeof input;
						return _keys(validatorObject)
							.includes(_type) ? tsValidateResult(input, validatorObject[_type] as ValidatorTypeResolver<T>) : 'Input does not match any of the possible types';
					}];
};

/**
 * Validates an array by validating each element.
 * 
 * Applies the validator to each element in the array. Returns an array of
 * validation results (one per element) if any elements fail. Supports multiple
 * validators (all must pass for each element) and minimum length checking.
 * 
 * **Strict mode**: When `strict=true`, validation errors include element indices.
 * When `strict=false`, errors may be less specific.
 * 
 * @template T - Array type
 * @template I - Element type
 * @param validator - Validator(s) to apply to each element (can be array for multiple validators)
 * @param mandatory - Whether array is required (default: true)
 * @param minimumLength - Minimum array length (default: 0)
 * @param strict - Whether to use strict validation mode (default: true)
 * @returns Validator that validates each array element
 */
export const tsValidateArray = <T extends any[], I extends ArrayType<T> = ArrayType<T>>(validator: ValidatorTypeResolver<I> | ValidatorTypeResolver<I>[], mandatory = true, minimumLength = 0, strict = true): Validator<I[]> => {
	return [tsValidateExists(mandatory),
					...asArray(validator).map(validator => {
						return (input?: I[]) => {
							const results: InvalidResultArray<I>[] = [];
							const _input = input as unknown as I[];
							if (_input.length < minimumLength)
								return 'Array length smaller than minimum defined length';
							for (let i = 0; i < _input.length; i++) {
								results[i] = tsValidateResult(_input[i], validator, undefined, strict, input) as InvalidResultArray<I>;
							}

							return filterInstances(results).length !== 0 ? results : undefined;
						};
					})];
};

/**
 * Validates a string with optional length constraints.
 * 
 * Supports:
 * - Single maximum length: `length = 10` (max 10 chars)
 * - Range: `length = [5, 10]` (min 5, max 10 chars)
 * - No limit: `length = -1` (any length)
 * 
 * @param length - Maximum length, or [min, max] range, or -1 for no limit (default: -1)
 * @param mandatory - Whether string is required (default: true)
 * @returns Validator for strings
 */
export const tsValidateString = (length: number | [number, number] = -1, mandatory = true): Validator<string> => {
	return [tsValidateExists(mandatory),
					(input?: string) => {
						// noinspection SuspiciousTypeOfGuard
						if (typeof input !== 'string')
							return `input is not a string`;

						if (Array.isArray(length)) {
							if (length[0] !== -1 && length[0] > input.length)
								return `input length is lesser than ${length[0]}`;

							if (length[1] !== -1 && input.length > length[1])
								return `input length is longer than ${length[1]}`;

						} else if (length !== -1 && input.length > length)
							return `input length is longer than ${length}`;

						return;
					}];
};

export const tsValidateAnyString = tsValidateString();
export const tsValidateOptionalAnyString = tsValidateString(-1, false);


export const tsValidateStringMinLength = (length: number, mandatory = true): Validator<string> => {
	return [tsValidateExists(mandatory),
					(input?: string) => {
						// noinspection SuspiciousTypeOfGuard
						if (typeof input !== 'string')
							return `input is not a string`;

						if (input.length >= length)
							return;

						return `input has less than ${length} chars`;
					}];
};

export const tsValidateNumber = (mandatory = true): Validator<number> => {
	return [tsValidateExists(mandatory),
					(input?: number) => {
						// noinspection SuspiciousTypeOfGuard
						if (typeof input === 'number')
							return;

						return `Input is not a number! \nvalue: ${input}\ntype: ${typeof input}`;
					}];
};

export const tsValidateAnyNumber = tsValidateNumber();
export const tsValidateOptionalAnyNumber = tsValidateNumber(false);

export const tsValidateEnum = (enumType: TypedMap<number | string>, mandatory = true): Validator<number | string> => {
	return [tsValidateExists(mandatory),
					(input?: number | string) => {
						// @ts-ignore
						if (exists(enumType[input]))
							return;

						return `Input is not a valid enum value in ${__stringify(enumType)}`;
					}];
};

export const tsValidateBoolean = (mandatory = true): Validator<boolean> => {
	return [tsValidateExists(mandatory),
					(input?: boolean) => {
						// noinspection SuspiciousTypeOfGuard
						if (typeof input === 'boolean')
							return;

						return `Input is not a boolean! \nvalue: ${input}\ntype: ${typeof input}`;
					}];
};

export const tsValidateValue = <T>(values: T[] | ReadonlyArray<T>, mandatory = true): Validator<any> => {
	return [tsValidateExists(mandatory),
					(input?: T) => {
						if (values.includes(input!))
							return;

						return `Input is not valid:\n  input: ${input && __stringify(input) || input}\n  options: ${__stringify(values)}\n`;
					}];
};

export const tsValidateIsInRange = (ranges: [number, number][], mandatory = true): Validator<number> => {
	return [tsValidateExists(mandatory),
					(input?: number) => {

						if (ranges.some((range) => range[0] <= input! && input! <= range[1]))
							return;

						return `Input is not valid: ${input}.  It should fit one of the expected range: ${__stringify(ranges)}`;
					}];
};

export const tsValidateRange = (mandatory = true): Validator<[number, number] | undefined> => {
	return [tsValidateExists(mandatory),
					(input?: [number, number]) => {
						if (!input)
							return 'Missing range';

						if (typeof input[0] !== 'number' || typeof input[1] !== 'number')
							return `Got range value that's not a number`;

						if (input[0] > input[1]) {
							return 'Range min is larger than range max';
						}

						return;
					}];
};
export const tsValidateRegexp = (regexp: RegExp, mandatory = true): Validator<string> => {
	return [tsValidateExists(mandatory),
					(input?: string) => {
						// console.log({input, regexp});
						if (regexp.test(input!))
							return;

						return `Input does not match regexp:\n  input: ${input}\n  regexp: ${regexp}\n`;
					}];
};

/**
 * Validates a timestamp is within a specified time interval from now.
 * 
 * Checks that the timestamp is between `(now - interval)` and `now`.
 * If no interval is provided, defaults to checking if timestamp is between 0 and now
 * (essentially any past or present timestamp).
 * 
 * @param interval - Maximum age in milliseconds (default: current time, i.e., any past timestamp)
 * @param mandatory - Whether timestamp is required (default: true)
 * @returns Validator for timestamps
 */
export const tsValidateTimestamp = (interval?: number, mandatory = true): Validator<number> => {
	return [tsValidateExists(mandatory),
					(input?: number) => {
						const now = currentTimeMillis();
						const minTimestamp = now - (interval || now);
						if (minTimestamp <= input! && input! <= now)
							return;

						return `Input is not valid:\n  input: ${input}\n  Expected Interval: ${minTimestamp} - ${now}\n`;
					}];
};

export const tsValidateAudit = (range: RangeTimestamp = {min: 0, max: Number.MAX_VALUE}) => {
	return (audit?: AuditBy) => {
		return tsValidateResult(audit?.auditAt?.timestamp, tsValidateIsInRange([[range.min, range.max]]));
	};
};

export const tsValidateTimeRange = (mandatory: boolean = true): Validator<TimeRange> => {
	return [tsValidateExists(mandatory), (instance?: TimeRange) => {
		if (!instance)
			return 'No instance was provided to validation';

		if (!instance.length || instance.every(value => value === undefined))
			return 'Empty time range provided';

		if (instance.length > 2)
			return 'Time range provided has too many values';

		if (!instance[0] && typeof instance[1] === 'number')
			return;

		if (!instance[1] && typeof instance[0] === 'number')
			return;

		return tsValidateResult(instance, tsValidateRange());
	}];
};

export const tsValidateNonMandatoryObject = <T extends object | undefined>(validator: ValidatorTypeResolver<T>) => {
	return [tsValidateExists(false),
					(input?: T) => tsValidateResult(input, validator)];
};

export const tsValidateOptionalObject = tsValidateNonMandatoryObject;

export const tsValidator_valueByKey = <T>(validatorObject: {
	[k: string]: ValidatorTypeResolver<any>
}, prop = 'type') => {
	return tsValidateCustom((value?, parentObject?) => {
		return tsValidateResult(value!, validatorObject[parentObject![prop]]) as InvalidResult<T>;
	}) as ValidatorTypeResolver<T>;
};

/**
 * Validates an array of objects using different validators based on a key value.
 * 
 * For each object in the array, looks up a validator from `validatorMap` using
 * the value of the specified `key`. This enables polymorphic validation where
 * different object types in the array are validated differently.
 * 
 * **Example**: Array of shapes where each shape has a `type` field ('circle' or 'square'),
 * and different validators are used based on the type.
 * 
 * @template T - Object type
 * @param key - Key to use for validator lookup
 * @param validatorMap - Map of key values to validators
 * @returns Validator for arrays of objects
 * @throws BadImplementationException if a key value has no corresponding validator
 */
export const tsValidator_ArrayOfObjectsByKey = <T extends object>(key: keyof T, validatorMap: {
	[k: string]: ValidatorTypeResolver<T>
}) => {
	return tsValidateArray(tsValidateCustom((value) => {
		const _value = value as T;
		const validator = validatorMap[_value[key] as string];
		if (!validator)
			throw new BadImplementationException(`No validator defined for key ${key as string} with value ${_value[key]}`);

		return tsValidateResult(_value, validator);
	}) as ValidatorTypeResolver<T>);
};

export const tsValidator_stringOrNumber = (mandatory = true) => {
	return tsValidateCustom((input?: string | number) => {
		switch (typeof input) {
			case 'string':
				return tsValidateResult(input, tsValidateString());

			case 'number':
				return tsValidateResult(input, tsValidateNumber());
		}
		return 'Input is not string or number.';
	}, mandatory) as ValidatorTypeResolver<string | number>;
};

export const tsValidateIpAddress = (mandatory = true): Validator<string> => {
	return [tsValidateExists(mandatory), (input?: string) => {
		if (!input && mandatory)
			return 'no input provided for validation of mandatory prop';

		if (tsValidateResult(input, tsValidateRegexp(/(([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])/)))
			return;

		if (tsValidateResult(input, tsValidateRegexp(/((([0-9a-fA-F]){1,4})\:){7}([0-9a-fA-F]){1,4}/)))
			return;

		return `Invalid input ${input}, not an ip address`;
	}];
};