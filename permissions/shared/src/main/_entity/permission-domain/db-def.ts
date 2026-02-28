import {Database, stringToUniqueId} from '@nu-art/db-api-shared';
import {tsValidateString} from '@nu-art/ts-common';
import {DatabaseDef_PermissionDomain, PermissionDomain_DbKey} from './types.js';
import {validateProjectId} from '../../validators.js';
import {PermissionDBGroup} from '../../consts.js';

const Validator_ModifiableProps: DatabaseDef_PermissionDomain['modifiablePropsValidator'] = {
	projectId: validateProjectId,
	namespace: tsValidateString(50),
};

const Validator_GeneratedProps: DatabaseDef_PermissionDomain['generatedPropsValidator'] = {
	_auditorId: tsValidateString()
};

export const DBDef_PermissionDomain: Database<DatabaseDef_PermissionDomain> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbKey: PermissionDomain_DbKey,
	frontend: {
		group: PermissionDBGroup,
		name: 'domain',
	},
	backend: {
		name: 'permissions--domain',
	},
	entityName: 'PermissionDomain',
	lockKeys: ['projectId'],
	dependencies: {
		projectId: {
			fieldType: 'string',
			dbKey: 'permissions--project',
		}
	}
};

/** Brand a string as DatabaseDef_PermissionDomain['id']. Use for literal ids (e.g. default domains). */
export const toPermissionDomainId = (id: string) => stringToUniqueId<typeof DBDef_PermissionDomain.dbKey>(id);
