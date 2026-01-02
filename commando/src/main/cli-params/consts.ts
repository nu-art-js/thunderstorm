import {exists, TypedMap} from '@nu-art/ts-common';
import {CliParam} from './types.js';

/**
 * Default processor for boolean CLI parameters.
 *
 * Returns the defaultValue or `true` if the flag is present
 *
 * @param input - Optional input string (flag presence indicator)
 * @param defaultValue - Optional default value if flag is absent
 * @returns `true` if flag is present, otherwise `defaultValue ?? false`
 */
export const DefaultProcessor_Boolean: CliParam<any, boolean>['process'] = (input?: string, defaultValue?: boolean): boolean => {
	return defaultValue ?? true;
};

/**
 * Default processor for string CLI parameters.
 *
 * Returns the input string, or defaultValue if input is empty/missing.
 * Throws if input is empty and no default is provided.
 *
 * @param input - Optional input string
 * @param defaultValue - Optional default value
 * @returns Processed string value
 * @throws Error if input is empty and no default provided
 */
export const DefaultProcessor_String: CliParam<any, string>['process'] = (input?: string, defaultValue?: string): string => {
	if (!input || !input.length) {
		if (!exists(defaultValue))
			throw new Error('expected string value');

		return defaultValue;
	}

	return input;
};

/**
 * Default processor for number CLI parameters.
 *
 * Parses the input as a number, or returns defaultValue if input is missing.
 * Throws if input is not a valid number or if input is empty and no default provided.
 *
 * @param input - Optional input string
 * @param defaultValue - Optional default value
 * @returns Parsed number value
 * @throws Error if input is not a number or missing with no default
 */
export const DefaultProcessor_Number: CliParam<any, number>['process'] = (input?: string, defaultValue?: number): number => {
	if (!input) {
		if (!exists(defaultValue))
			throw new Error('expected number value');

		return defaultValue;
	}

	if (isNaN(Number(input)))
		throw new Error('expected number value');

	return Number(input);
};

/**
 * Map of default processors by type name.
 *
 * Used by CLIParamsResolver to assign processors when not provided.
 * Keys match the type strings from `TypeOfTypeAsString`.
 */
export const DefaultProcessorsMapper: TypedMap<CliParam<any, any>['process']> = {
	string: DefaultProcessor_String,
	boolean: DefaultProcessor_Boolean,
	number: DefaultProcessor_Number,
};

