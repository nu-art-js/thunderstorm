import {tsValidateExists, Validator, ValidatorTypeResolver} from './validator-core';
import {
	tsValidateArray,
	tsValidateBoolean,
	tsValidateRegexp,
	tsValidateString,
	tsValidateTimestamp
} from './type-validators';
import {AuditableV2, DB_Object} from '../utils/types';


export const tsValidate_OptionalArray = <T>(validator: ValidatorTypeResolver<T>) => tsValidateArray(validator, false);
export const tsValidator_nonMandatoryString = tsValidateString(-1, false);

export const tsValidateMD5 = (mandatory = true): Validator<string> => {
	return tsValidateRegexp(/[a-zA-Z\d]{32}/, mandatory);
};

export const tsValidator_colorHex = tsValidateRegexp(/^#(?:[a-fA-F0-9]{8}|[a-fA-F0-9]{6}|[a-fA-F0-9]{3,4})$/);

export const tsValidateMustExist = tsValidateExists();
export const tsValidateOptional = tsValidateExists(false);


export const dbIdLength = 32;

export const tsValidateId = (length: number, mandatory: boolean = true) => tsValidateRegexp(new RegExp(`^[0-9a-f]{${length}}$`), mandatory);
export const tsValidateEmail = tsValidateRegexp(
	/[a-z0-9](?:\.?[a-z0-9!#$%&'*+/=?^_`{|}~\-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?/);
export const tsValidateBucketUrl = (mandatory?: boolean) => tsValidateRegexp(
	/gs?:\/\/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/, mandatory);
export const tsValidateGeneralUrl = (mandatory?: boolean) => tsValidateRegexp(
	/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/, mandatory);
export const tsValidateVersion = tsValidateRegexp(/\d{1,3}\.\d{1,3}\.\d{1,3}/);
export const tsValidateUniqueId = tsValidateId(dbIdLength);
export const tsValidator_arrayOfUniqueIds = tsValidateArray(tsValidateUniqueId);
export const tsValidate_optionalArrayOfUniqueIds = tsValidate_OptionalArray(tsValidateUniqueId);


export const tsValidateOptionalId = tsValidateId(dbIdLength, false);
export const tsValidateStringWithDashes = tsValidateRegexp(/^[A-Za-z-]+$/);
export const tsValidateStringAndNumbersWithDashes = tsValidateRegexp(/^[0-9A-Za-z-]+$/);
export const tsValidator_JavaObjectMemberName = tsValidateRegexp(/^[a-z][a-zA-Z0-9]+$/);
export const tsValidateNameWithDashesAndDots = tsValidateRegexp(/^[a-z-.]+$/);
export const tsValidator_LowercaseStringWithDashes = tsValidateRegexp(/^[a-z-.]+$/);
export const tsValidator_LowerUpperStringWithSpaces = tsValidateRegexp(/^[A-Za-z ]+$/);
export const tsValidator_LowerUpperStringWithDashesAndUnderscore = tsValidateRegexp(/^[A-Za-z-_]+$/);
export const tsValidator_InternationalPhoneNumber = tsValidateRegexp(/^\+(?:[0-9] ?){6,14}[0-9]$/);

export const tsValidator_AuditableV2: ValidatorTypeResolver<AuditableV2> = {_auditorId: tsValidateString()};

export const DB_Object_validator: ValidatorTypeResolver<DB_Object> = {
	_id: tsValidateUniqueId,
	_v: tsValidateVersion,
	_originDocId: tsValidateOptionalId,
	__hardDelete: tsValidateBoolean(false),
	__created: tsValidateTimestamp(),
	__updated: tsValidateTimestamp(),
};

