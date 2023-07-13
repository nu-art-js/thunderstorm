import {
	OmitDBObject,
	tsValidateEmail,
	tsValidateOptional,
	tsValidateString,
	ValidatorTypeResolver
} from '@nu-art/ts-common';
import {DBDef} from '@nu-art/ts-common/db/types';
import {ProxyServiceAccount} from './types';

export const Validator_ServiceAccount: ValidatorTypeResolver<OmitDBObject<ProxyServiceAccount>> = {
	label: tsValidateString(),
	email: tsValidateEmail,
	extra: tsValidateOptional
};

export const DBDef_RemoteProxy: DBDef<ProxyServiceAccount> = {
	validator: Validator_ServiceAccount,
	dbName: 'service-accounts',
	entityName: 'ServiceAccount',
};
