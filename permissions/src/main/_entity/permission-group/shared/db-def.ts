import {
	DBDef_V3,
	tsValidateArray,
	tsValidateDynamicObject,
	tsValidateNumber,
	tsValidateOptionalId,
	tsValidateString,
	tsValidateUniqueId
} from '@nu-art/ts-common';
import {DBProto_PermissionGroup} from './types';
import {validateGroupLabel} from '../../../shared/validators';

const Validator_ModifiableProps: DBProto_PermissionGroup['modifiablePropsValidator'] = {
	label: validateGroupLabel,
	projectId: tsValidateOptionalId,
	accessLevelIds: tsValidateArray(tsValidateUniqueId, false),
};

const Validator_GeneratedProps: DBProto_PermissionGroup['generatedPropsValidator'] = {
	_levelsMap: tsValidateDynamicObject(tsValidateNumber(), tsValidateString(), false),
	_auditorId: tsValidateString(),
};

export const DBDef_PermissionGroup: DBDef_V3<DBProto_PermissionGroup> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbName: 'permissions--group',
	entityName: 'PermissionGroup',
	dependencies: {
		projectId: {
			dbName: 'permissions--project',
			fieldType: 'string',
		},
		accessLevelIds: {
			dbName: 'permissions--level',
			fieldType: 'string[]',
		}
	}
};