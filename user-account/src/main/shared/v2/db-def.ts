import {
	OmitDBObject,
	tsValidateEmail,
	tsValidateString,
	tsValidateTimestamp,
	tsValidateUniqueId,
	tsValidator_nonMandatoryString,
	ValidatorTypeResolver
} from '@nu-art/ts-common';
import {DBDef} from '@nu-art/ts-common/db/types';
import {DB_Account_V2, DB_Session_V2} from './types';


export const Validator_Session: ValidatorTypeResolver<OmitDBObject<DB_Session_V2>> = {
	sessionId: tsValidateString(),
	accountId: tsValidateUniqueId,
	timestamp: tsValidateTimestamp()
};

export const DBDef_Session: DBDef<DB_Session_V2, 'accountId'> = {
	validator: Validator_Session,
	dbName: 'user-account--sessions',
	entityName: 'Session',
	uniqueKeys: ['accountId']
};

export const Validator_Account: ValidatorTypeResolver<OmitDBObject<DB_Account_V2>> = {
	email: tsValidateEmail,
	salt: tsValidator_nonMandatoryString,
	saltedPassword: tsValidator_nonMandatoryString,
	_auditorId: tsValidateString()
};

export const DBDef_Account: DBDef<DB_Account_V2, 'email'> = {
	validator: Validator_Account,
	dbName: 'user-account--accounts',
	entityName: 'Account',
	generatedProps: ['salt', 'saltedPassword', '_auditorId'],
	uniqueKeys: ['email']
};