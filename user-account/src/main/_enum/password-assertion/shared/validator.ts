import {
	_keys,
	generateArray,
	ImplementationMissingException,
	MUSTNeverHappenException,
	tsValidateRegexp,
	tsValidateResult,
	tsValidateString,
	tsValidateStringMinLength,
	Validator,
	ValidatorImpl
} from '@nu-art/ts-common';
import {
	PasswordAssertionConfig,
	PasswordAssertionType,
	PasswordAssertionType_CapitalLetters,
	PasswordAssertionType_LowerCaseLetters,
	PasswordAssertionType_MaxLength,
	PasswordAssertionType_MinLength,
	PasswordAssertionType_Numbers,
	PasswordAssertionType_SpecialChars,
	PasswordAssertionTypes
} from './types';

type PasswordAssertionTypeValidator = (amount: number) => Validator<string>;

const specialChars = '.*?[!@#$%^&*()_\\+\\-=\\[\\]{},.\\/;\':"<> |\\\\]';
const numbers = '.*?[0-9]';
const lowerCaseLetters = '.*?[a-z]';
const capitalLetters = '.*?[A-Z]';

export const Validator_PasswordAssertion: { [Type in PasswordAssertionType]: PasswordAssertionTypeValidator } = {
	[PasswordAssertionType_MinLength]: (amount: number) => tsValidateStringMinLength(amount),
	[PasswordAssertionType_MaxLength]: (amount: number) => tsValidateString(amount),
	[PasswordAssertionType_SpecialChars]: (amount: number) => tsValidateRegexp(new RegExp(generateArray(amount, _ => specialChars).join(''))),
	[PasswordAssertionType_Numbers]: (amount: number) => tsValidateRegexp(new RegExp(generateArray(amount, _ => numbers).join(''))),
	[PasswordAssertionType_LowerCaseLetters]: (amount: number) => tsValidateRegexp(new RegExp(generateArray(amount, _ => lowerCaseLetters).join(''))),
	[PasswordAssertionType_CapitalLetters]: (amount: number) => tsValidateRegexp(new RegExp(generateArray(amount, _ => capitalLetters).join(''))),
};

export const assertPasswordRules = (password: string, assertionConfig?: PasswordAssertionConfig) => {
	if (!assertionConfig)
		return;

	const passwordValidators: ValidatorImpl<string>[] = [];
	for (const key of _keys(assertionConfig)) {
		if (!PasswordAssertionTypes.includes(key))
			throw new MUSTNeverHappenException(`Unknown password assertion type ${key}`);

		const amount = assertionConfig[key]!;
		const validator = Validator_PasswordAssertion[key];
		if (!validator)
			throw new ImplementationMissingException(`No password assertion validator for type ${key} exists`);
		passwordValidators.push(validator(amount) as ValidatorImpl<string>);
	}

	return tsValidateResult(password, passwordValidators);
};