import {DBDef_V3} from '@nu-art/ts-common/db/types';
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
import {DBProto_AccountType, DBProto_SessionType} from './types';
import {_accountTypes} from './consts';


export const Validator_Modifiable: DBProto_SessionType['modifiablePropsValidator'] = {
	accountId: tsValidateUniqueId,
	deviceId: tsValidateUniqueId,
	sessionId: tsValidateString(),
	timestamp: tsValidateTimestamp(),
	needToRefresh: tsValidateBoolean(false)
};

export const Validator_Generated: DBProto_SessionType['generatedPropsValidator'] = {
	...DB_Object_validator
};

export const DBDef_Session: DBDef_V3<DBProto_SessionType> = {
	modifiablePropsValidator: Validator_Modifiable,
	generatedPropsValidator: Validator_Generated,
	dbName: 'user-account--sessions',
	entityName: 'Session',
	uniqueKeys: ['accountId', 'deviceId'],
	versions: ['1.0.0'],
};

const modifiablePropsValidator: DBProto_AccountType['modifiablePropsValidator'] = {
	email: tsValidateEmail,
	type: tsValidateValue(_accountTypes),
	thumbnail: tsValidateString(undefined, false),
	displayName: tsValidateString(undefined, false),
};

const generatedPropsValidator: DBProto_AccountType['generatedPropsValidator'] = {
	...DB_Object_validator,
	_auditorId: tsValidateString(),
	_newPasswordRequired: tsValidateBoolean(false),
	salt: tsValidator_nonMandatoryString,
	saltedPassword: tsValidator_nonMandatoryString,
};

export const DBDef_Accounts: DBDef_V3<DBProto_AccountType> = {
	dbName: 'user-account--accounts',
	entityName: 'Account',
	modifiablePropsValidator: modifiablePropsValidator,
	generatedPropsValidator: generatedPropsValidator,
	versions: ['1.0.0']
};
