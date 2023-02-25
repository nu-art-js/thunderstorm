import {__stringify, exists} from '../utils/tools';
import {InvalidResult, InvalidResultArray, InvalidResultObject, tsValidateExists, tsValidateResult, Validator, ValidatorTypeResolver} from './validator-core';
import {currentTimeMillis} from '../utils/date-time-tools';
import {ArrayType, AuditBy, RangeTimestamp, TypedMap} from '../utils/types';
import {filterInstances} from '../utils/array-tools';
import {_keys} from '../utils/object-tools';
import {LogLevel} from '../core/logger/types';


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
					res[key as keyof T] = `Key: ${_keyRes}}\nValue: ${_valRes}` as InvalidResult<T[keyof T]>;
				else if (_valRes)
					res[key as keyof T] = 'Value: ' + _valRes as InvalidResult<T[keyof T]>;
				else if (_keyRes)
					res[key as keyof T] = 'Key: ' + _keyRes as InvalidResult<T[keyof T]>;

				return res;
			}, {});
			return _keys(_result).length ? _result : undefined;
		}];
};

export const tsValidateUnion = <T extends any>(validators: ValidatorTypeResolver<T>[], mandatory = true) => {
	return [tsValidateExists(mandatory),
		(input?: any) => {
			const results: InvalidResultArray<T>[] = [];
			for (const validator of validators) {
				const _res = tsValidateResult(input, validator);
				if (!_res)
					return;
				results.push(_res);
			}

			return filterInstances(results).length !== 0 ? ['Input does not match any of the possible types',
				results] as InvalidResultArray<T>[] : undefined;
		}];
};

export const tsValidateCustom = <T extends any>(processor: (input?: T, parentInput?: any) => InvalidResult<T>, mandatory = true): Validator<T>[] => {
	return [tsValidateExists(mandatory),
		processor];
};

const typeFunc = (type: any) => typeof type;
type types = ReturnType<typeof typeFunc>;
type validatorObject<T> = { [k in types]?: ValidatorTypeResolver<T> }
export const tsValidateUnionV3 = <T extends any>(validatorObject: validatorObject<T>, mandatory = true) => {
	return [tsValidateExists(mandatory),
		(input?: T) => {
			const _type = typeof input;
			return _keys(validatorObject)
				.includes(_type) ? tsValidateResult(input, validatorObject[_type] as ValidatorTypeResolver<T>) : 'Input does not match any of the possible types';
		}];
};

export const tsValidateArray = <T extends any[], I extends ArrayType<T> = ArrayType<T>>(validator: ValidatorTypeResolver<I>, mandatory = true, minimumLength: number = 0): Validator<I[]> => {
	return [tsValidateExists(mandatory),
		(input?: I[]) => {
			const results: InvalidResultArray<I>[] = [];
			const _input = input as unknown as I[];
			if (_input.length < minimumLength)
				return 'Array length smaller than minimum defined length';
			for (let i = 0; i < _input.length; i++) {
				results[i] = tsValidateResult(_input[i], validator);
			}

			return filterInstances(results).length !== 0 ? results : undefined;
		}];
};

export const tsValidateString = (length: number = -1, mandatory = true): Validator<string> => {
	return [tsValidateExists(mandatory),
		(input?: string) => {
			// noinspection SuspiciousTypeOfGuard
			if (typeof input !== 'string')
				return `input is not a string`;

			if (length === -1)
				return;

			if (input.length <= length)
				return;

			return `input is longer than ${length}`;
		}];
};

export const tsValidator_nonMandatoryString = tsValidateString(-1, false);

export const tsValidateNumber = (mandatory = true): Validator<number> => {
	return [tsValidateExists(mandatory),
		(input?: number) => {
			// noinspection SuspiciousTypeOfGuard
			if (typeof input === 'number')
				return;

			return `Input is not a number! \nvalue: ${input}\ntype: ${typeof input}`;
		}];
};

export const tsValidateEnum = (enumType: TypedMap<number | string>, mandatory = true): Validator<number | string> => {
	return [tsValidateExists(mandatory),
		(input?: number | string) => {
			// @ts-ignore
			if (exists(enumType[input]))
				return;

			return `Input is not a valid enum value in ${__stringify(enumType)}`;
		}];
};

tsValidateEnum(LogLevel);
export const tsValidateBoolean = (mandatory = true): Validator<boolean> => {
	return [tsValidateExists(mandatory),
		(input?: boolean) => {
			// noinspection SuspiciousTypeOfGuard
			if (typeof input === 'boolean')
				return;

			return `Input is not a boolean! \nvalue: ${input}\ntype: ${typeof input}`;
		}];
};

export const tsValidateValue = (values: string[], mandatory = true): Validator<string> => {
	return [tsValidateExists(mandatory),
		(input?: string) => {
			if (values.includes(input!))
				return;

			return `Input is not valid:\n  input: ${input}\n  options: ${__stringify(values)}\n`;
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

export const tsValidateMD5 = (mandatory = true): Validator<string> => {
	return tsValidateRegexp(/[a-zA-Z\d]{32}/, mandatory);
};

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

export const tsValidateAudit = (range?: RangeTimestamp) => {
	return (audit?: AuditBy) => {
		return tsValidateResult(audit?.auditAt?.timestamp, tsValidateIsInRange([[0,
			Number.MAX_VALUE]]));
	};
};

export const tsValidateNonMandatoryObject = <T>(validator: ValidatorTypeResolver<T>) => {
	return [tsValidateExists(false),
		(input?: T) => tsValidateResult(input, validator)];
};

const validateColorValue = tsValidateRegexp(/^#(?:[0-9a-fA-F]{3}){1,2}$/);
export const tsValidator_color = {value: validateColorValue};

