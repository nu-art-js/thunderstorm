import {DB_PermissionAccessLevel, DB_PermissionDomain, DB_PermissionProject} from './management';
import {DB_PermissionGroup, DB_PermissionUser} from './assign';
import {TypedKeyValue, TypedMap, UniqueId} from '@nu-art/ts-common';


export type PermissionTypes = {
	Project: DB_PermissionProject;
	Domain: DB_PermissionDomain;
	Level: DB_PermissionAccessLevel;
	Group: DB_PermissionGroup;
	User: DB_PermissionUser;
}

export type SessionData_Permissions = TypedKeyValue<'permissions', TypedMap<number>>

export type UI_PermissionKeyData = {
	accessLevelIds: UniqueId[];
	_accessLevels?: { [domainId: UniqueId]: number }
}

export type PermissionKeyType = 'permission-key';
export type DB_PermissionKeyData = {
	type: PermissionKeyType
	accessLevelIds: UniqueId[];
	_accessLevels: { [domainId: UniqueId]: number }
}

export type DefaultDef_Api = { path: string, accessLevel: string /* access level name */ };

export type DefaultDef_GeneratedApi = { domain: string, collections: string[] };

export type DefaultDef_Project = {
	_id: string
	name: string,
	packages: DefaultDef_Package[]
	groups?: DefaultDef_Group[]
}

export type DefaultDef_Package = {
	name: string
	domains: DefaultDef_Domain[]
	groups?: DefaultDef_Group[]
}

export type DefaultDef_Domain = {
	_id: string,
	namespace: string,
	levels?: DefaultDef_AccessLevel[]
	customApis?: DefaultDef_Api[],
	dbNames?: string[]
}

export type DefaultDef_AccessLevel = {
	_id: string
	name: string
	value: number
}

export type DefaultDef_Group = {
	_id: string
	name: string
	accessLevels: { [domainName: string]: string } // access level name
};