import {DBDef_V3, tsValidateBoolean, tsValidateEmail, tsValidateString, tsValidateValue, tsValidator_nonMandatoryString} from '@nu-art/ts-common';
import {_accountTypes, DBProto_Account} from './types';
import {accountGroupName} from '../../session/shared/consts';

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
	dbKey: 'user-account--accounts',
	entityName: 'Account',
	modifiablePropsValidator: modifiablePropsValidator,
	generatedPropsValidator: generatedPropsValidator,
	versions: ['1.0.0'],
	frontend: {
		group: accountGroupName,
		name: 'account'
	},
	backend: {
		name: 'user-account--accounts',
	}
};