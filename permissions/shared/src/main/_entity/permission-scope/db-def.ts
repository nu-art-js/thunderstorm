import {tsValidateString} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {DatabaseDef_PermissionScope, PermissionScope_DbKey} from './types.js';
import {PermissionDBGroup} from '../../consts.js';

const Validator_ModifiableProps: DatabaseDef_PermissionScope['modifiablePropsValidator'] = {
	key: tsValidateString(),
	value: tsValidateString(),
};

const Validator_GeneratedProps: DatabaseDef_PermissionScope['generatedPropsValidator'] = {};

export const DBDef_PermissionScope: Database<DatabaseDef_PermissionScope> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbKey: PermissionScope_DbKey,
	entityName: 'PermissionScope',
	frontend: {
		group: PermissionDBGroup,
		name: 'scope',
	},
	backend: {
		name: `${PermissionDBGroup}--scopes`
	},
};

