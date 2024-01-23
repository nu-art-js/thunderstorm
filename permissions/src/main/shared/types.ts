import {TypedKeyValue, TypedMap, UniqueId} from '@nu-art/ts-common';
import {PermissionKey_BE} from '../backend/PermissionKey_BE';
import {DB_PermissionAccessLevel, DB_PermissionDomain, DB_PermissionGroup, DB_PermissionProject, DB_PermissionUser} from './_entity';


export type PermissionTypes = {
	PermissionProject: DB_PermissionProject;
	PermissionDomain: DB_PermissionDomain;
	PermissionAccessLevel: DB_PermissionAccessLevel;
	PermissionGroup: DB_PermissionGroup;
	PermissionUser: DB_PermissionUser;
}

export type SessionData_Permissions = TypedKeyValue<'permissions', TypedMap<number>>

export type UI_PermissionKeyData = {
	accessLevelIds: UniqueId[];
	_accessLevels?: { [domainId: UniqueId]: number }
}

export const Const_PermissionKeyType = 'permission-key';
export type PermissionKeyType = typeof Const_PermissionKeyType;
export type DB_PermissionKeyData = {
	type: PermissionKeyType
	accessLevelIds: UniqueId[];
	_accessLevels: { [domainId: UniqueId]: number }
}

export type DefaultDef_Api = {
	path: string,
	accessLevel: string /* access level name */
	domainId?: string
};

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
	permissionKeys?: PermissionKey_BE<string>[]
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
