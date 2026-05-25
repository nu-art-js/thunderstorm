import {tsValidateBoolean, tsValidateDynamicObject, tsValidateString, tsValidateUniqueId} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {accountGroupName} from '../session/consts.js';
import {DatabaseDef_BootstrapToken} from './types.js';

export const Validator_BootstrapToken_Modifiable: DatabaseDef_BootstrapToken['modifiablePropsValidator'] = {
	accountId: tsValidateUniqueId,
	label: tsValidateString(200),
	metadata: tsValidateDynamicObject(tsValidateString(), tsValidateString(), false),
	revoked: tsValidateBoolean(),
};

export const Validator_BootstrapToken_Generated: DatabaseDef_BootstrapToken['generatedPropsValidator'] = {};

export const DBDef_BootstrapToken: Database<DatabaseDef_BootstrapToken> = {
	modifiablePropsValidator: Validator_BootstrapToken_Modifiable,
	generatedPropsValidator: Validator_BootstrapToken_Generated,
	dbKey: 'user-account--bootstrap-tokens',
	entityName: 'BootstrapToken',
	versions: ['1.0.0'],
	frontend: {
		group: accountGroupName,
		name: 'bootstrap-token',
	},
	backend: {
		name: 'user-account--bootstrap-tokens',
	}
};
