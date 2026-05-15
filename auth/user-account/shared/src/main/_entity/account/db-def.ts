import {tsValidateEmail, tsValidateString, tsValidateValue} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {_accountTypes, DatabaseDef_Account} from './types.js';
import {accountGroupName} from '../session/consts.js';

const modifiablePropsValidator: DatabaseDef_Account['modifiablePropsValidator'] = {
	email: tsValidateEmail,
	type: tsValidateValue(_accountTypes),
	thumbnail: tsValidateString(undefined, false),
	displayName: tsValidateString(undefined, false),
	description: tsValidateString(undefined, false)
};

const generatedPropsValidator: DatabaseDef_Account['generatedPropsValidator'] = {
	_auditorId: tsValidateString(),
};

export const DBDef_Accounts: Database<DatabaseDef_Account> = {
	dbKey: 'user-account--accounts',
	entityName: 'Account',
	modifiablePropsValidator,
	generatedPropsValidator,
	generatedProps: ['_auditorId'],
	versions: ['1.0.0'],
	uniqueKeys: ['_id'],
	frontend: {
		group: accountGroupName,
		name: 'account'
	},
	backend: {
		name: 'user-account--accounts',
	}
};