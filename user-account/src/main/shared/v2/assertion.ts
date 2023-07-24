import {_keys, filterDuplicates, flatArray, generateArray, tsValidateRegexp, tsValidateResult, tsValidateString, Validator} from '@nu-art/ts-common';


export type PasswordAssertionTypes = 'min-length' | 'special-chars' | 'capital-letters' | 'numbers'
export type PasswordValidator = { type: PasswordAssertionTypes, validator: (num: number) => Validator<string> };
export type PasswordAssertionConfig = { [K in PasswordAssertionTypes]: number };

const specialChars = '.*?[!@#$%^&*()_+-=\\[\\]{},./;\':"<>|\\\\]';
const capitalLetters = '.*?[A-Z]';
const numbers = '.*?[0-9]';
type _PasswordAssertion = {
	'min-length': PasswordValidator
	'special-chars': PasswordValidator
	'capital-letters': PasswordValidator
	numbers: PasswordValidator
};

export const PasswordAssertion: _PasswordAssertion = {
	'min-length': {
		type: 'min-length',
		validator: (length: number) => tsValidateString(length)
	},
	'special-chars': {
		type: 'special-chars',
		validator: (count: number) => {
			return tsValidateRegexp(new RegExp(generateArray(count, _ => specialChars).join()));
		}
	},
	'capital-letters': {
		type: 'capital-letters',
		validator: (count: number) => {
			return tsValidateRegexp(new RegExp(generateArray(count, _ => capitalLetters).join()));
		}
	},
	numbers: {
		type: 'numbers',
		validator: (count: number) => {
			return tsValidateRegexp(new RegExp(generateArray(count, _ => numbers).join()));
		}
	}
};

export const assertPasswordRules = (password: string, assertionConfig?: PasswordAssertionConfig) => {
	if (!assertionConfig)
		return;

	const passwordValidator = filterDuplicates(flatArray(_keys(assertionConfig)
		.map(assertKey => PasswordAssertion[assertKey].validator(assertionConfig[assertKey]))));

	return tsValidateResult(password, passwordValidator);
};