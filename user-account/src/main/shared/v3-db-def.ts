import {DBDef_V3} from '@nu-art/ts-common/db/types';
import {_accountTypesV3, DBProto_AccountType, DBProto_SessionType} from './v3-types';
import {
	DB_Object_validator,
	tsValidateEmail,
	tsValidateUniqueId,
	tsValidator_nonMandatoryString
} from '@nu-art/ts-common/validator/validators';
import {
	tsValidateBoolean,
	tsValidateString,
	tsValidateTimestamp,
	tsValidateValue
} from '@nu-art/ts-common/validator/type-validators';


export const Validator_Modifiable: DBProto_SessionType['modifiablePropsValidator'] = {
	sessionId: tsValidateString(),
	accountId: tsValidateUniqueId,
	timestamp: tsValidateTimestamp()
};

export const Validator_Generated: DBProto_SessionType['generatedPropsValidator'] = {
	...DB_Object_validator
};

export const DBDef_v3_Session: DBDef_V3<DBProto_SessionType> = {
	modifiablePropsValidator: Validator_Modifiable,
	generatedPropsValidator: Validator_Generated,
	dbName: 'user-account--sessions',
	entityName: 'Session',
	uniqueKeys: ['accountId'],
	versions: ['1.0.0'],
};


const modifiablePropsValidator: DBProto_AccountType['modifiablePropsValidator'] = {
	email: tsValidateEmail,
	type: tsValidateValue(_accountTypesV3),
	thumbnail: tsValidateString(undefined, false),
	displayName: tsValidateString(undefined, false),
	salt: tsValidator_nonMandatoryString,
	saltedPassword: tsValidator_nonMandatoryString,
};

const generatedPropsValidator: DBProto_AccountType['generatedPropsValidator'] = {
	...DB_Object_validator,
	_auditorId: tsValidateString(),
	_newPasswordRequired: tsValidateBoolean(false),
};

export const DBDef_v3_Accounts: DBDef_V3<DBProto_AccountType> = {
	dbName: 'user-account--accounts',
	entityName: 'Account',
	uniqueKeys: ['email'],
	modifiablePropsValidator: modifiablePropsValidator,
	generatedPropsValidator: generatedPropsValidator,
	versions: ['1.0.0']
};
