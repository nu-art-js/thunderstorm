import {Database, stringToUniqueId} from '@nu-art/db-api-shared';
import {tsValidateString} from '@nu-art/ts-common';
import {DatabaseDef_PermissionProject, PermissionProject_DbKey} from './types.js';
import {PermissionDBGroup} from '../../consts.js';
import {validateProjectName} from '../../validators.js';

const Validator_ModifiableProps: DatabaseDef_PermissionProject['modifiablePropsValidator'] = {
	name: validateProjectName,
};

const Validator_GeneratedProps: DatabaseDef_PermissionProject['generatedPropsValidator'] = {
	_auditorId: tsValidateString()
};

export const DBDef_PermissionProject: Database<DatabaseDef_PermissionProject> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	generatedProps: ['_auditorId'],
	versions: ['1.0.0'],
	dbKey: PermissionProject_DbKey,
	entityName: 'PermissionsProject',
	frontend: {
		group: PermissionDBGroup,
		name: 'project',
	},
	backend: {
		name: 'permissions--project'
	}
};

/** Brand a string as DatabaseDef_PermissionProject['id']. Use for literal ids (e.g. default projects). */
export const toPermissionProjectId = (id: string) => stringToUniqueId<typeof DBDef_PermissionProject.dbKey>(id);
