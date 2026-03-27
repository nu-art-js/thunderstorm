import {
	tsValidateArray,
	tsValidateString,
} from '@nu-art/ts-common';
import {Database, stringToUniqueId} from '@nu-art/db-api-shared';
import {DatabaseDef_PermissionGroup, PermissionGroup_DbKey} from './types.js';
import {PermissionDBGroup} from '../../consts.js';
import {validateGroupLabel} from '../../validators.js';
import {tsValidator_AuditableV2} from '@nu-art/user-account-shared';

const Validator_ModifiableProps: DatabaseDef_PermissionGroup['modifiablePropsValidator'] = {
	label: validateGroupLabel,
	uiLabel: tsValidateString(),
	scopeEntries: tsValidateArray(tsValidateString(), false),
};

const Validator_GeneratedProps: DatabaseDef_PermissionGroup['generatedPropsValidator'] = {
	...tsValidator_AuditableV2,
};

export const DBDef_PermissionGroup: Database<DatabaseDef_PermissionGroup> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	generatedProps: [],
	versions: ['2.0.0', '1.0.0'],
	dbKey: PermissionGroup_DbKey,
	entityName: 'PermissionGroup',
	frontend: {
		group: PermissionDBGroup,
		name: 'group',
	},
	backend: {
		name: 'permissions--group'
	},
	dependencies: undefined
};

/** Brand a string as DatabaseDef_PermissionGroup['id']. Use for literal ids (e.g. default groups). */
export const toPermissionGroupId = (id: string) => stringToUniqueId<DatabaseDef_PermissionGroup["dbKey"]>(id);
