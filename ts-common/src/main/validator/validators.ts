import {tsValidateExists, Validator, ValidatorTypeResolver} from './validator-core';
import {tsValidateArray, tsValidateRegexp, tsValidateString} from './type-validators';


export const tsValidate_OptionalArray = <T>(validator: ValidatorTypeResolver<T>) => tsValidateArray(validator, false);
export const tsValidator_nonMandatoryString = tsValidateString(-1, false);

export const tsValidateMD5 = (mandatory = true): Validator<string> => {
	return tsValidateRegexp(/[a-zA-Z\d]{32}/, mandatory);
};

export const tsValidator_colorHex = tsValidateRegexp(/^#(?:[a-fA-F0-9]{8}|[a-fA-F0-9]{6}|[a-fA-F0-9]{3,4})$/);

export const tsValidateMustExist = tsValidateExists();
export const tsValidateOptional = tsValidateExists(false);

