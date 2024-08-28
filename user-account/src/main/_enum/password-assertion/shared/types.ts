import {ResponseError} from '@thunder-storm/common/core/exceptions/types';

export const PasswordAssertionType_MinLength = 'min-length';
export const PasswordAssertionType_MaxLength = 'max-length';
export const PasswordAssertionType_SpecialChars = 'special-chars';
export const PasswordAssertionType_Numbers = 'numbers';
export const PasswordAssertionType_LowerCaseLetters = 'lower-case-letters';
export const PasswordAssertionType_CapitalLetters = 'capital-letters';

export const PasswordAssertionTypes = [
	PasswordAssertionType_MinLength,
	PasswordAssertionType_MaxLength,
	PasswordAssertionType_SpecialChars,
	PasswordAssertionType_Numbers,
	PasswordAssertionType_LowerCaseLetters,
	PasswordAssertionType_CapitalLetters,
] as const;

export type PasswordAssertionType = typeof PasswordAssertionTypes[number];
export type PasswordAssertionConfig = { [K in PasswordAssertionType]?: number };
export type PasswordFailureReport = { [K in PasswordAssertionType]: string };
export type PasswordAssertionResponseError = ResponseError<'password-assertion-error', PasswordFailureReport>;