import {DBDef_V3, tsValidateString} from '@nu-art/ts-common';
import {DBProto_PermissionProject} from './types';
import {validateProjectName} from '../../../shared/validators';
import {PermissionDBGroup} from '../../shared';

const Validator_ModifiableProps: DBProto_PermissionProject['modifiablePropsValidator'] = {
	name: validateProjectName,
};

const Validator_GeneratedProps: DBProto_PermissionProject['generatedPropsValidator'] = {
	_auditorId: tsValidateString()
};

export const DBDef_PermissionProject: DBDef_V3<DBProto_PermissionProject> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbKey: 'permissions--project',
	entityName: 'PermissionsProject',
	dbGroup: PermissionDBGroup,
};