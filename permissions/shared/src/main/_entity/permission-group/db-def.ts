import {
	tsValidateArray,
	tsValidateDynamicObject,
	tsValidateNumber,
	tsValidateOptionalId,
	tsValidateString,
	tsValidateUniqueId,
} from '@nu-art/ts-common';
import {Database, stringToUniqueId} from '@nu-art/db-api-shared';
import {DatabaseDef_PermissionGroup, PermissionGroup_DbKey} from './types.js';
import {PermissionDBGroup} from '../../consts.js';
import {validateGroupLabel} from '../../validators.js';
import {tsValidator_AuditableV2} from '@nu-art/user-account-shared';

const Validator_ModifiableProps: DatabaseDef_PermissionGroup['modifiablePropsValidator'] = {
	label: validateGroupLabel,
	uiLabel: tsValidateString(),
	projectId: tsValidateOptionalId,
	accessLevelIds: tsValidateArray(tsValidateUniqueId, false),
};

const Validator_GeneratedProps: DatabaseDef_PermissionGroup['generatedPropsValidator'] = {
	...tsValidator_AuditableV2,
	_levelsMap: tsValidateDynamicObject(tsValidateNumber(), tsValidateString(), false),
};

export const DBDef_PermissionGroup: Database<DatabaseDef_PermissionGroup> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	generatedProps: ['_levelsMap'],
	versions: ['1.0.1', '1.0.0'],
	dbKey: PermissionGroup_DbKey,
	entityName: 'PermissionGroup',
	frontend: {
		group: PermissionDBGroup,
		name: 'group',
	},
	backend: {
		name: 'permissions--group'
	},
	dependencies: {
		projectId: {
			dbKey: 'permissions--project',
			fieldType: 'string',
		},
		accessLevelIds: {
			dbKey: 'permissions--level',
			fieldType: 'string[]',
		}
	}
};

/** Brand a string as DatabaseDef_PermissionGroup['id']. Use for literal ids (e.g. default groups). */
export const toPermissionGroupId = (id: string) => stringToUniqueId<typeof DBDef_PermissionGroup.dbKey>(id);
