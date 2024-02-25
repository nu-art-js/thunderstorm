import {DBDef_V3, tsValidateArray, tsValidateBoolean, tsValidateDynamicObject, tsValidateNumber, tsValidateString, tsValidateUniqueId} from '@nu-art/ts-common';
import {DBProto_PermissionAPI} from './types';
import {tsValidateStringWithDashesAndSlash, validateProjectId} from '../../../shared/validators';
import {PermissionDBGroup} from '../../shared';


const Validator_ModifiableProps: DBProto_PermissionAPI['modifiablePropsValidator'] = {
	projectId: validateProjectId,
	path: tsValidateStringWithDashesAndSlash,
	accessLevelIds: tsValidateArray(tsValidateUniqueId, false),
	deprecated: tsValidateBoolean(false),
	onlyForApplication: tsValidateBoolean(false),
};

const Validator_GeneratedProps: DBProto_PermissionAPI['generatedPropsValidator'] = {
	_auditorId: tsValidateString(),
	_accessLevels: tsValidateDynamicObject(tsValidateNumber(), tsValidateString(), false),
};

export const DBDef_PermissionAPI: DBDef_V3<DBProto_PermissionAPI> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbName: 'permissions--api',
	dbGroup: PermissionDBGroup,
	entityName: 'PermissionsAPI',
	uniqueKeys: ['projectId', 'path'],
	dependencies: {
		projectId: {
			dbName: 'permissions--project',
			fieldType: 'string'
		},
		accessLevelIds: {
			dbName: 'permissions--level',
			fieldType: 'string[]'
		}
	}
};