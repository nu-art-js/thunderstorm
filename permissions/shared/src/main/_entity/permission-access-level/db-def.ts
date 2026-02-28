import {Database} from '@nu-art/db-api-shared';
import {tsValidateIsInRange, tsValidateString, tsValidateStringWithDashes, tsValidateUniqueId} from '@nu-art/ts-common';
import {DatabaseDef_PermissionAccessLevel, PermissionAccessLevel_DbKey} from './types.js';
import {PermissionDBGroup} from '../../consts.js';

const Validator_ModifiableProps: DatabaseDef_PermissionAccessLevel['modifiablePropsValidator'] = {
	domainId: tsValidateUniqueId,
	name: tsValidateStringWithDashes,
	uiLabel: tsValidateString(),
	value: tsValidateIsInRange([[0, 1000]]),
};

const Validator_GeneratedProps: DatabaseDef_PermissionAccessLevel['generatedPropsValidator'] = {
	_auditorId: tsValidateString()
};

export const DBDef_PermissionAccessLevel: Database<DatabaseDef_PermissionAccessLevel> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.1', '1.0.0'],
	dbKey: PermissionAccessLevel_DbKey,
	entityName: 'PermissionAccessLevel',
	frontend: {
		group: PermissionDBGroup,
		name: 'level',
	},
	backend: {
		name: 'permissions--level',
	},
	dependencies: {
		domainId: {
			dbKey: 'permissions--domain',
			fieldType: 'string',
		}
	}
};
