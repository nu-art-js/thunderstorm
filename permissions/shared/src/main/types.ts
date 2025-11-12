import {TypedKeyValue, TypedMap, UniqueId} from '@nu-art/ts-common';
import {DomainToLevelValueMap} from './_entity/permission-api/index.js';

export type PermissionKey = string
export const Const_PermissionKeyType = 'permission-key';
export type PermissionKeyType = typeof Const_PermissionKeyType;

export type DefaultDef_Api = {
	path: string,
	accessLevel: string /* access level name */
	domainId?: string
};

export type DefaultDef_GeneratedApi = { domain: string, collections: string[] };

export type DB_PermissionKeyData = {
	type: PermissionKeyType
	accessLevelIds: UniqueId[];
	_accessLevels: DomainToLevelValueMap
}

export type PreDBAccessLevel = {
	name: string,
	value: number
};

export type DefaultDef_AccessLevel = {
	_id: string
	name: string
	uiLabel: string
	value: number
}


export type DefaultDef_Group = {
	_id: string
	name: string
	uiLabel: string
	accessLevels: { [domainName: string]: string } // access level name
};

export type SessionData_Permissions_Value = {
	domainToValueMap: TypedMap<number>
	roles: { key: string, uiLabel: string }[]
};

export type SessionData_Permissions = TypedKeyValue<'permissions', SessionData_Permissions_Value>
export type SessionData_StrictMode = TypedKeyValue<'strictMode', { isStrictMode: boolean }>
