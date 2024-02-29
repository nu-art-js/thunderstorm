import {DBDef_V3, tsValidateString} from '@nu-art/ts-common';
import {DBProto_PermissionDomain} from './types';
import {validateProjectId} from '../../../shared/validators';
import {PermissionDBGroup} from '../../shared';

const Validator_ModifiableProps: DBProto_PermissionDomain['modifiablePropsValidator'] = {
	projectId: validateProjectId,
	namespace: tsValidateString(50),
};

const Validator_GeneratedProps: DBProto_PermissionDomain['generatedPropsValidator'] = {
	_auditorId: tsValidateString()
};

export const DBDef_PermissionDomain: DBDef_V3<DBProto_PermissionDomain> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbKey: 'permissions--domain',
	dbGroup: PermissionDBGroup,
	entityName: 'PermissionDomain',
	lockKeys: ['projectId'],
	dependencies: {
		projectId: {
			fieldType: 'string',
			dbKey: 'permissions--project',
		}
	}
};