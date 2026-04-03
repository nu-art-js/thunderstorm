import {tsValidateArray, tsValidateBoolean, tsValidateString, tsValidateValue, tsValidator_arrayOfUniqueIds,} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {DatabaseDef_PermissionRole, PermissionRole_DbKey} from './types.js';
import {PermissionScope_DbKey} from '../permission-scope/types.js';
import {PermissionDBGroup} from '../../consts.js';

const Validator_ModifiableProps: DatabaseDef_PermissionRole['modifiablePropsValidator'] = {
	label: tsValidateString(),
	type: tsValidateValue(['personal', 'assignable'] as const),
	scopeEntries: tsValidator_arrayOfUniqueIds,
	dbPointer: tsValidateArray({dbKey: tsValidateString(), id: tsValidateString()}, false),
	system: tsValidateBoolean(false),
};

const Validator_GeneratedProps: DatabaseDef_PermissionRole['generatedPropsValidator'] = {};

export const DBDef_PermissionRole: Database<DatabaseDef_PermissionRole> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbKey: PermissionRole_DbKey,
	entityName: 'PermissionRole',
	frontend: {
		group: PermissionDBGroup,
		name: 'role',
	},
	backend: {
		name: `${PermissionDBGroup}--roles`
	},
	dependencies: {
		scopeEntries: {dbKey: PermissionScope_DbKey, fieldType: 'string[]'},
	},
};

