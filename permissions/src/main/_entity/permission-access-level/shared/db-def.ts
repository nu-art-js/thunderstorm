import {DBDef_V3, tsValidateIsInRange, tsValidateString, tsValidateStringWithDashes, tsValidateUniqueId} from '@nu-art/ts-common';
import {DBProto_PermissionAccessLevel} from './types';
import {PermissionDBGroup} from '../../shared';

const Validator_ModifiableProps: DBProto_PermissionAccessLevel['modifiablePropsValidator'] = {
	domainId: tsValidateUniqueId,
	name: tsValidateStringWithDashes,
	value: tsValidateIsInRange([[0, 1000]]),
};

const Validator_GeneratedProps: DBProto_PermissionAccessLevel['generatedPropsValidator'] = {
	_auditorId: tsValidateString()
};

export const DBDef_PermissionAccessLevel: DBDef_V3<DBProto_PermissionAccessLevel> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbName: 'permissions--level',
	dbGroup: PermissionDBGroup,
	entityName: 'PermissionAccessLevel',
	dependencies: {
		domainId: {
			dbName: 'permissions--domain',
			fieldType: 'string',
		}
	}
};