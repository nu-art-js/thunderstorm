import {tsValidateExists, tsValidateResult, Validator, ValidatorTypeResolver} from './validator-core.js';
import {tsValidateArray, tsValidateBoolean, tsValidateRegexp, tsValidateString, tsValidateTimestamp, tsValidateValue} from './type-validators.js';
import {DBPointer} from '../utils/types.js';
import {DBDef_V3} from '../db/types.js';


/**
 * Validates an optional array (non-mandatory).
 *
 * @template T - Element type
 * @param validator - Validator for array elements
 * @returns Validator for optional arrays
 */
export const tsValidate_OptionalArray = <T>(validator: ValidatorTypeResolver<T>) => tsValidateArray(validator, false);
/** Validator for optional strings with no length restriction */
export const tsValidator_nonMandatoryString = tsValidateString(-1, false);

/**
 * Validates an MD5 hash string.
 *
 * **Note**: MD5 is cryptographically broken and should not be used for security.
 * This validator only checks format (32 hex characters), not cryptographic validity.
 *
 * @param mandatory - Whether MD5 is required (default: true)
 * @returns Validator for MD5 hash strings
 */
export const tsValidateMD5 = (mandatory = true): Validator<string> => {
	return tsValidateRegexp(/[a-zA-Z\d]{32}/, mandatory);
};

/**
 * Validates a hex color code (with optional alpha channel).
 *
 * Supports formats: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
 */
export const tsValidator_colorHex = tsValidateRegexp(/^#(?:[a-fA-F0-9]{8}|[a-fA-F0-9]{6}|[a-fA-F0-9]{3,4})$/);

/** Validator that requires a value to exist (not null/undefined) */
export const tsValidateMustExist = tsValidateExists();
/** Validator that allows optional values (null/undefined are valid) */
export const tsValidateOptional = tsValidateExists(false);

/** Standard database ID length (32 hex characters) */
export const dbIdLength = 32;
/** Database reference ID length (128 hex characters) */
export const dbRefIdLength = 128;

/**
 * Validates a hexadecimal ID of a specific length.
 *
 * @param length - Expected length in hex characters
 * @param mandatory - Whether ID is required (default: true)
 * @returns Validator for hex IDs
 */
export const tsValidateId = (length: number, mandatory: boolean = true) => tsValidateRegexp(new RegExp(`^[0-9a-f]{${length}}$`), mandatory);

/**
 * Validates an email address format.
 *
 * Uses a permissive regex pattern that accepts most valid email formats.
 * Does not validate that the domain actually exists.
 */
export const tsValidateEmail = tsValidateRegexp(
	/[a-z0-9](?:\.?[a-z0-9!#$%&'*+/=?^_`{|}~\-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?/);

/**
 * Validates a Google Cloud Storage or S3 bucket URL.
 *
 * Supports both `gs://` (Google Cloud Storage) and `s3://` (AWS S3) URLs.
 *
 * @param mandatory - Whether URL is required
 * @returns Validator for bucket URLs
 */
export const tsValidateBucketUrl = (mandatory?: boolean) => tsValidateRegexp(
	/gs?:\/\/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/, mandatory);

/**
 * Validates a general HTTPS URL.
 *
 * Requires HTTPS protocol and optionally includes port numbers.
 *
 * @param mandatory - Whether URL is required
 * @returns Validator for HTTPS URLs
 */
export const tsValidateGeneralUrl = (mandatory?: boolean) => tsValidateRegexp(
	/https:\/\/[-a-zA-Z0-9@:%._\+~#=]{2,256}(?:\.[a-z]{2,6})?:?(?:[0-9]{3,5})?\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/, mandatory);

/**
 * Validates a short URL identifier.
 *
 * Requires exactly 8 characters from a specific character set (alphanumeric and some symbols).
 *
 * @param mandatory - Whether short URL is required (default: true)
 * @returns Validator for short URLs
 */
export const tsValidateShortUrl = (mandatory = true) => tsValidateRegexp(
	/^[A-Za-z0-9-_.!*'()]{8}$/, mandatory
);

/**
 * Validates a semantic version string (X.Y.Z format).
 *
 * Each component can be 1-3 digits. Examples: "1.0.0", "123.45.678"
 */
export const tsValidateVersion = tsValidateRegexp(/\d{1,3}\.\d{1,3}\.\d{1,3}/);

/** Validator for standard database unique IDs (32 hex characters) */
export const tsValidateUniqueId = tsValidateId(dbIdLength);
/** Validator for arrays of unique IDs */
export const tsValidator_arrayOfUniqueIds = tsValidateArray(tsValidateUniqueId);
/** Validator for optional arrays of unique IDs */
export const tsValidate_optionalArrayOfUniqueIds = tsValidate_OptionalArray(tsValidateUniqueId);

/**
 * Validates a database pointer (reference to another database object).
 *
 * Validates that the `dbKey` exists in the provided database definitions and
 * that the `id` is a valid unique ID.
 *
 * @param dbDefs - Array of database definitions to validate against
 * @param mandatory - Whether DB pointer is required (default: true)
 * @returns Validator for database pointers
 */
export const tsValidateDBPointer: (dbDefs: DBDef_V3<any>[], mandatory?: boolean) => ValidatorTypeResolver<DBPointer> = (dbDefs, mandatory = true) => {
	const keys = dbDefs.map(def => def.dbKey);
	return [tsValidateExists(mandatory), (dbRef) => tsValidateResult(dbRef, {
		dbKey: tsValidateValue(keys),
		id: tsValidateUniqueId,
	})];
};

export const tsValidateOptionalId = tsValidateId(dbIdLength, false);
export const tsValidateStringWithDashes = tsValidateRegexp(/^[A-Za-z-]+$/);
export const tsValidateStringAndNumbersWithDashes = tsValidateRegexp(/^[0-9A-Za-z-]+$/);
export const tsValidator_JavaObjectMemberName = tsValidateRegexp(/^[a-z][a-zA-Z0-9]+$/);
export const tsValidateNameWithDashesAndDots = tsValidateRegexp(/^[a-z-.]+$/);
export const tsValidateNameWithDashesAndDotsAndNumbers = tsValidateRegexp(/^[a-z0-9-.]+$/);
export const tsValidator_LowercaseStringWithDashes = tsValidateRegexp(/^[a-z-.]+$/);
export const tsValidator_LowerUpperStringWithSpaces = tsValidateRegexp(/^[A-Za-z ]+$/);
export const tsValidator_LowerUpperStringWithDashesAndUnderscore = tsValidateRegexp(/^[A-Za-z-_]+$/);
export const tsValidator_InternationalPhoneNumber = tsValidateRegexp(/^\+(?:[0-9] ?){6,14}[0-9]$/);
export const tsValidator_DB_RefId = tsValidateId(dbRefIdLength);

export const DB_Object_validator = {
	// this will be the way to handle app level context via proto.. need to rename this to __metadata once done
	__metadata1: tsValidateOptional,
	_id: tsValidateUniqueId,
	_v: tsValidateVersion,
	_originDocId: tsValidateOptionalId,
	__hardDelete: tsValidateBoolean(false),
	__created: tsValidateTimestamp(),
	__updated: tsValidateTimestamp(),
};
