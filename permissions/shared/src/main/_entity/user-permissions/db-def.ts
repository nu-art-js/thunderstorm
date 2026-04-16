import {tsValidateArray, tsValidateDynamicObject, tsValidateString, tsValidator_arrayOfUniqueIds} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {DatabaseDef_UserPermissions, UserPermissions_DbKey} from './types.js';
import {PermissionDBGroup} from '../../consts.js';

const Validator_ModifiableProps: DatabaseDef_UserPermissions['modifiablePropsValidator'] = {
	scopeEntries: tsValidateArray(tsValidateString()),
	accessIds: tsValidateDynamicObject(tsValidator_arrayOfUniqueIds, tsValidateString()),
};

const Validator_GeneratedProps: DatabaseDef_UserPermissions['generatedPropsValidator'] = {};

export const DBDef_UserPermissions: Database<DatabaseDef_UserPermissions> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbKey: UserPermissions_DbKey,
	entityName: 'UserPermissions',
	frontend: {
		group: PermissionDBGroup,
		name: 'user-permissions',
	},
	backend: {
		name: `${PermissionDBGroup}--user-permissions`,
	},
};
