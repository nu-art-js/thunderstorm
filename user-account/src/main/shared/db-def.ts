import {DBDef_V3} from '@nu-art/ts-common/db/types';
import {tsValidateEmail, tsValidateUniqueId, tsValidator_nonMandatoryString} from '@nu-art/ts-common/validator/validators';
import {tsValidateArray, tsValidateBoolean, tsValidateString, tsValidateTimestamp, tsValidateValue} from '@nu-art/ts-common/validator/type-validators';
import {DBProto_Account, DBProto_Session} from './types';
import {_accountTypes} from './consts';


export const Validator_Modifiable: DBProto_Session['modifiablePropsValidator'] = {
	label: tsValidateString(100,false),
	accountId: tsValidateUniqueId,
	deviceId: tsValidateUniqueId,
	prevSession: tsValidateArray(tsValidateString(), false),
	sessionId: tsValidateString(),
	timestamp: tsValidateTimestamp(),
	needToRefresh: tsValidateBoolean(false)
};

export const Validator_Generated: DBProto_Session['generatedPropsValidator'] = {};

export const DBDef_Session: DBDef_V3<DBProto_Session> = {
	modifiablePropsValidator: Validator_Modifiable,
	generatedPropsValidator: Validator_Generated,
	dbName: 'user-account--sessions',
	entityName: 'Session',
	uniqueKeys: ['accountId', 'deviceId'],
	versions: ['1.0.0'],
};

const modifiablePropsValidator: DBProto_Account['modifiablePropsValidator'] = {
	email: tsValidateEmail,
	type: tsValidateValue(_accountTypes),
	thumbnail: tsValidateString(undefined, false),
	displayName: tsValidateString(undefined, false),
};

const generatedPropsValidator: DBProto_Account['generatedPropsValidator'] = {
	_auditorId: tsValidateString(),
	_newPasswordRequired: tsValidateBoolean(false),
	salt: tsValidator_nonMandatoryString,
	saltedPassword: tsValidator_nonMandatoryString,
};

export const DBDef_Accounts: DBDef_V3<DBProto_Account> = {
	dbName: 'user-account--accounts',
	entityName: 'Account',
	modifiablePropsValidator: modifiablePropsValidator,
	generatedPropsValidator: generatedPropsValidator,
	versions: ['1.0.0']
};
