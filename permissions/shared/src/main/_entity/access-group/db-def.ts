import {tsValidateString, tsValidateValue, tsValidate_optionalArrayOfUniqueIds, tsValidator_arrayOfUniqueIds} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import type {AccessGroupType, DatabaseDef_AccessGroup} from './types.js';
import {AccessGroup_DbKey} from './types.js';
import {PermissionDBGroup} from '../../consts.js';
import {PermissionScope_DbKey} from '../permission-scope/types.js';

const accessGroupTypes: AccessGroupType[] = ['user', 'service-account', 'entity', 'custom'];

const Validator_ModifiableProps: DatabaseDef_AccessGroup['modifiablePropsValidator'] = {
	type: tsValidateValue(accessGroupTypes),
	key: tsValidateString(),
	label: tsValidateString(),
	members: tsValidator_arrayOfUniqueIds,
	scopeEntries: tsValidate_optionalArrayOfUniqueIds,
};

const Validator_GeneratedProps: DatabaseDef_AccessGroup['generatedPropsValidator'] = {};

export const DBDef_AccessGroup: Database<DatabaseDef_AccessGroup> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbKey: AccessGroup_DbKey,
	entityName: 'AccessGroup',
	frontend: {
		group: PermissionDBGroup,
		name: 'access-group',
	},
	backend: {
		name: `${PermissionDBGroup}--access-groups`,
	},
	dependencies: {
		scopeEntries: {dbKey: PermissionScope_DbKey, fieldType: 'string[]'},
	},
};
