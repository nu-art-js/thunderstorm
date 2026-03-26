import {TypedKeyValue, TypedMap} from '@nu-art/ts-common';
import {DatabaseDef_PermissionAccessLevel} from './_entity/permission-access-level/types.js';
import {DatabaseDef_PermissionDomain} from './_entity/permission-domain/types.js';
import {DatabaseDef_PermissionGroup} from './_entity/permission-group/types.js';
import {DomainToLevelValueMap} from './_entity/permission-api/types.js';

export type PermissionKey = string
export const Const_PermissionKeyType = 'permission-key';
export type PermissionKeyType = typeof Const_PermissionKeyType;

export type DefaultDef_Api = {
	path: string,
	accessLevel: string /* access level name */
	domainId?: DatabaseDef_PermissionDomain['id']
};

export type DefaultDef_GeneratedApi = { domain: string, collections: string[] };

export type DB_PermissionKeyData = {
	type: PermissionKeyType
	accessLevelIds: DatabaseDef_PermissionAccessLevel['id'][];
	_accessLevels: DomainToLevelValueMap
}

export type PreDBAccessLevel = {
	name: string,
	value: number
};

export type DefaultDef_AccessLevel = {
	_id: DatabaseDef_PermissionAccessLevel['id']
	name: string
	uiLabel: string
	value: number
}


export type DefaultDef_Group = {
	_id: DatabaseDef_PermissionGroup['id']
	name: string
	uiLabel: string
	accessLevels: { [domainName: string]: string } // access level name
};

export type SessionData_Permissions_Value = {
	domainToValueMap: TypedMap<number>
	scopeEntries: string[]
	roles: { key: string, uiLabel: string }[]
};

export type SessionData_Permissions = TypedKeyValue<'permissions', SessionData_Permissions_Value>
export type SessionData_StrictMode = TypedKeyValue<'strictMode', { isStrictMode: boolean }>
