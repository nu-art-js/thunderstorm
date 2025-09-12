import {exists, TypedMap} from '@nu-art/ts-common';
import {CliParam} from './types.js';


export const DefaultProcessor_Boolean: CliParam<any, boolean>['process'] = (input?: string, defaultValue?: boolean): boolean => {
	return true;
};

export const DefaultProcessor_String: CliParam<any, string>['process'] = (input?: string, defaultValue?: string): string => {
	if (!input || !input.length) {
		if (!exists(defaultValue))
			throw new Error('expected string value');

		return defaultValue;
	}

	return input;
};

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

export const DefaultProcessorsMapper: TypedMap<CliParam<any, any>['process']> = {
	string: DefaultProcessor_String,
	boolean: DefaultProcessor_Boolean,
	number: DefaultProcessor_Number,
};

