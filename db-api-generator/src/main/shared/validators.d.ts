import { AuditableV2, DB_Object, ValidatorTypeResolver } from '@nu-art/ts-common';
export declare const dbIdLength = 32;
export declare const tsValidateId: (length: number, mandatory?: boolean) => import("@nu-art/ts-common").Validator<string>;
export declare const tsValidateEmail: import("@nu-art/ts-common").Validator<string>;
export declare const tsValidateBucketUrl: (mandatory?: boolean) => import("@nu-art/ts-common").Validator<string>;
export declare const tsValidateGeneralUrl: (mandatory?: boolean) => import("@nu-art/ts-common").Validator<string>;
export declare const tsValidateVersion: import("@nu-art/ts-common").Validator<string>;
export declare const tsValidateUniqueId: import("@nu-art/ts-common").Validator<string>;
export declare const tsValidator_arrayOfUniqueIds: import("@nu-art/ts-common").Validator<string[]>;
export declare const tsValidate_optionalArrayOfUniqueIds: import("@nu-art/ts-common").Validator<string[]>;
export declare const tsValidateOptionalId: import("@nu-art/ts-common").Validator<string>;
export declare const tsValidateStringWithDashes: import("@nu-art/ts-common").Validator<string>;
export declare const tsValidateStringAndNumbersWithDashes: import("@nu-art/ts-common").Validator<string>;
export declare const tsValidator_JavaObjectMemberName: import("@nu-art/ts-common").Validator<string>;
export declare const tsValidateNameWithDashesAndDots: import("@nu-art/ts-common").Validator<string>;
export declare const tsValidator_LowercaseStringWithDashes: import("@nu-art/ts-common").Validator<string>;
export declare const tsValidator_LowerUpperStringWithSpaces: import("@nu-art/ts-common").Validator<string>;
export declare const tsValidator_LowerUpperStringWithDashesAndUnderscore: import("@nu-art/ts-common").Validator<string>;
export declare const tsValidator_InternationalPhoneNumber: import("@nu-art/ts-common").Validator<string>;
export declare const tsValidator_AuditableV2: ValidatorTypeResolver<AuditableV2>;
export declare const DB_Object_validator: ValidatorTypeResolver<DB_Object>;