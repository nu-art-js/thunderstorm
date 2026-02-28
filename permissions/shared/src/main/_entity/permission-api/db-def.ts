import {tsValidateArray, tsValidateBoolean, tsValidateDynamicObject, tsValidateNumber, tsValidateString, tsValidateUniqueId} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {DatabaseDef_PermissionAPI, PermissionAPI_DbKey} from './types.js';
import {PermissionDBGroup} from '../../consts.js';
import {tsValidateStringWithDashesAndSlash, validateProjectId} from '../../validators.js';
import {tsValidator_AuditableV2} from '@nu-art/user-account-shared';

const Validator_ModifiableProps: DatabaseDef_PermissionAPI['modifiablePropsValidator'] = {
	projectId: validateProjectId,
	path: tsValidateStringWithDashesAndSlash,
	accessLevelIds: tsValidateArray(tsValidateUniqueId, false),
	deprecated: tsValidateBoolean(false),
	onlyForApplication: tsValidateBoolean(false),
};

const Validator_GeneratedProps: DatabaseDef_PermissionAPI['generatedPropsValidator'] = {
	...tsValidator_AuditableV2,
	_accessLevels: tsValidateDynamicObject(tsValidateNumber(), tsValidateString(), false),
};

export const DBDef_PermissionAPI: Database<DatabaseDef_PermissionAPI> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	generatedProps: ['_auditorId', '_accessLevels'],
	versions: ['1.0.1', '1.0.0'],
	dbKey: PermissionAPI_DbKey,
	frontend: {
		group: PermissionDBGroup,
		name: 'api',
	},
	backend: {
		name: 'permissions--api',
	},
	entityName: 'PermissionsAPI',
	uniqueKeys: ['projectId', 'path'],
	dependencies: {
		projectId: {
			dbKey: 'permissions--project',
			fieldType: 'string'
		},
		accessLevelIds: {
			dbKey: 'permissions--level',
			fieldType: 'string[]'
		}
	}
};
