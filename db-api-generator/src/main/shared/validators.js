"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DB_Object_validator = exports.tsValidator_AuditableV2 = exports.tsValidator_InternationalPhoneNumber = exports.tsValidator_LowerUpperStringWithDashesAndUnderscore = exports.tsValidator_LowerUpperStringWithSpaces = exports.tsValidator_LowercaseStringWithDashes = exports.tsValidateNameWithDashesAndDots = exports.tsValidator_JavaObjectMemberName = exports.tsValidateStringAndNumbersWithDashes = exports.tsValidateStringWithDashes = exports.tsValidateOptionalId = exports.tsValidate_optionalArrayOfUniqueIds = exports.tsValidator_arrayOfUniqueIds = exports.tsValidateUniqueId = exports.tsValidateVersion = exports.tsValidateGeneralUrl = exports.tsValidateBucketUrl = exports.tsValidateEmail = exports.tsValidateId = exports.dbIdLength = void 0;
const ts_common_1 = require("@nu-art/ts-common");
const validators_1 = require("@nu-art/ts-common/validator/validators");
exports.dbIdLength = 32;
const tsValidateId = (length, mandatory = true) => (0, ts_common_1.tsValidateRegexp)(new RegExp(`^[0-9a-f]{${length}}$`), mandatory);
exports.tsValidateId = tsValidateId;
exports.tsValidateEmail = (0, ts_common_1.tsValidateRegexp)(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/);
const tsValidateBucketUrl = (mandatory) => (0, ts_common_1.tsValidateRegexp)(/gs?:\/\/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/, mandatory);
exports.tsValidateBucketUrl = tsValidateBucketUrl;
const tsValidateGeneralUrl = (mandatory) => (0, ts_common_1.tsValidateRegexp)(/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/, mandatory);
exports.tsValidateGeneralUrl = tsValidateGeneralUrl;
exports.tsValidateVersion = (0, ts_common_1.tsValidateRegexp)(/\d{1,3}\.\d{1,3}\.\d{1,3}/);
exports.tsValidateUniqueId = (0, exports.tsValidateId)(exports.dbIdLength);
exports.tsValidator_arrayOfUniqueIds = (0, ts_common_1.tsValidateArray)(exports.tsValidateUniqueId);
exports.tsValidate_optionalArrayOfUniqueIds = (0, validators_1.tsValidate_OptionalArray)(exports.tsValidateUniqueId);
exports.tsValidateOptionalId = (0, exports.tsValidateId)(exports.dbIdLength, false);
exports.tsValidateStringWithDashes = (0, ts_common_1.tsValidateRegexp)(/^[A-Za-z-]+$/);
exports.tsValidateStringAndNumbersWithDashes = (0, ts_common_1.tsValidateRegexp)(/^[0-9A-Za-z-]+$/);
exports.tsValidator_JavaObjectMemberName = (0, ts_common_1.tsValidateRegexp)(/^[a-z][a-zA-Z0-9]+$/);
exports.tsValidateNameWithDashesAndDots = (0, ts_common_1.tsValidateRegexp)(/^[a-z-.]+$/);
exports.tsValidator_LowercaseStringWithDashes = (0, ts_common_1.tsValidateRegexp)(/^[a-z-.]+$/);
exports.tsValidator_LowerUpperStringWithSpaces = (0, ts_common_1.tsValidateRegexp)(/^[A-Za-z ]+$/);
exports.tsValidator_LowerUpperStringWithDashesAndUnderscore = (0, ts_common_1.tsValidateRegexp)(/^[A-Za-z-_]+$/);
exports.tsValidator_InternationalPhoneNumber = (0, ts_common_1.tsValidateRegexp)(/^\+(?:[0-9] ?){6,14}[0-9]$/);
exports.tsValidator_AuditableV2 = { _auditorId: (0, ts_common_1.tsValidateString)() };
exports.DB_Object_validator = {
    _id: exports.tsValidateUniqueId,
    _v: exports.tsValidateVersion,
    __created: (0, ts_common_1.tsValidateTimestamp)(),
    __updated: (0, ts_common_1.tsValidateTimestamp)(),
};
//# sourceMappingURL=validators.js.map