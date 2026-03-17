import {tsValidateArray, tsValidateStringAndNumbersWithDashes} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {DatabaseDef_PermissionUser, PermissionUser_DbKey} from './types.js';
import {PermissionDBGroup} from '../../consts.js';
import {tsValidator_AuditableV2} from '@nu-art/user-account-shared';

const Validator_ModifiableProps: DatabaseDef_PermissionUser['modifiablePropsValidator'] = {
	groups: tsValidateArray({
		groupId: tsValidateStringAndNumbersWithDashes,
	}, false),
};

const Validator_GeneratedProps: DatabaseDef_PermissionUser['generatedPropsValidator'] = {
	...tsValidator_AuditableV2,
	__groupIds: tsValidateArray(tsValidateStringAndNumbersWithDashes, false),
};

export const DBDef_PermissionUser: Database<DatabaseDef_PermissionUser> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	generatedProps: ['__groupIds', '_auditorId'],
	versions: ['1.0.0'],
	dbKey: PermissionUser_DbKey,
	entityName: 'PermissionUser',
	frontend: {
		group: PermissionDBGroup,
		name: 'user',
	},
	backend: {
		name: 'permissions--user'
	},
	dependencies: {
		'__groupIds': {
			fieldType: 'string[]',
			dbKey: 'permissions--group',
		}
	}
};
