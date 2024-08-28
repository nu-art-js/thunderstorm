import {_keys, generateArray, tsValidateRegexp, tsValidateResult, tsValidateString, tsValidateStringMinLength, Validator} from '@thunder-storm/common';
import {
	PasswordAssertionConfig,
	PasswordAssertionType,
	PasswordAssertionType_CapitalLetters,
	PasswordAssertionType_LowerCaseLetters,
	PasswordAssertionType_MaxLength,
	PasswordAssertionType_MinLength,
	PasswordAssertionType_Numbers,
	PasswordAssertionType_SpecialChars,
	PasswordAssertionTypes,
	PasswordFailureReport
} from './types';

type PasswordAssertionTypeValidator = (amount: number) => Validator<string>;

const specialChars = '.*?[!@#$%^&*()_\\+\\-=\\[\\]{},.\\/;\':"<> |\\\\]';
const numbers = '.*?[0-9]';
const lowerCaseLetters = '.*?[a-z]';
const capitalLetters = '.*?[A-Z]';

const Validator_PasswordAssertion: { [Type in PasswordAssertionType]: PasswordAssertionTypeValidator } = {
	[PasswordAssertionType_MinLength]: (amount: number) => tsValidateStringMinLength(amount),
	[PasswordAssertionType_MaxLength]: (amount: number) => tsValidateString(amount),
	[PasswordAssertionType_SpecialChars]: (amount: number) => tsValidateRegexp(new RegExp(generateArray(amount, _ => specialChars).join(''))),
	[PasswordAssertionType_Numbers]: (amount: number) => tsValidateRegexp(new RegExp(generateArray(amount, _ => numbers).join(''))),
	[PasswordAssertionType_LowerCaseLetters]: (amount: number) => tsValidateRegexp(new RegExp(generateArray(amount, _ => lowerCaseLetters).join(''))),
	[PasswordAssertionType_CapitalLetters]: (amount: number) => tsValidateRegexp(new RegExp(generateArray(amount, _ => capitalLetters).join(''))),
};

const PasswordFailureMessages: { [Type in PasswordAssertionType]: (amount: number) => string } = {
	[PasswordAssertionType_MinLength]: (amount: number) => `Password is shorter than ${amount} characters`,
	[PasswordAssertionType_MaxLength]: (amount: number) => `Password is longer than ${amount} characters`,
	[PasswordAssertionType_SpecialChars]: (amount: number) => `Password does not contain at least ${amount} special characters`,
	[PasswordAssertionType_Numbers]: (amount: number) => `Password does not contain at least ${amount} numbers`,
	[PasswordAssertionType_LowerCaseLetters]: (amount: number) => `Password does not contain at least ${amount} lower case characters`,
	[PasswordAssertionType_CapitalLetters]: (amount: number) => `Password does not contain at least ${amount} capital letters`,
};

export const assertPasswordRules = (password: string, assertionConfig?: PasswordAssertionConfig): PasswordFailureReport | undefined => {
	if (!assertionConfig)
		return;

	const results: PasswordFailureReport = _keys(assertionConfig).reduce((results, assertionKey) => {
		if (!PasswordAssertionTypes.includes(assertionKey)) {
			results[assertionKey] = `Unknown assertion key ${assertionKey}`;
			return results;
		}

		const amount = assertionConfig[assertionKey]!;
		const validator = Validator_PasswordAssertion[assertionKey](amount);
		const result = tsValidateResult(password, validator);
		if (result)
			results[assertionKey] = PasswordFailureMessages[assertionKey](amount);

		return results;
	}, {} as PasswordFailureReport);


	return _keys(results).length ? results : undefined;
};