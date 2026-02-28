import {PermissionKey_BE} from './PermissionKey_BE.js';
import {
	DatabaseDef_PermissionDomain,
	DatabaseDef_PermissionProject,
	DB_PermissionAccessLevel,
	DB_PermissionDomain,
	DB_PermissionGroup,
	DB_PermissionProject,
	DB_PermissionUser,
	DefaultDef_AccessLevel,
	DefaultDef_Api,
	DefaultDef_Group
} from '@nu-art/permissions-shared';


export type PermissionTypes = {
	PermissionProject: DB_PermissionProject;
	PermissionDomain: DB_PermissionDomain;
	PermissionAccessLevel: DB_PermissionAccessLevel;
	PermissionGroup: DB_PermissionGroup;
	PermissionUser: DB_PermissionUser;
}


export type DefaultDef_Project = {
	_id: DatabaseDef_PermissionProject['id'];
	name: string,
	packages: DefaultDef_Package[]
	groups?: DefaultDef_Group[]
}


export type DefaultDef_Domain = {
	_id: DatabaseDef_PermissionDomain['id'];
	namespace: string,
	levels?: DefaultDef_AccessLevel[]
	customApis?: DefaultDef_Api[],
	dbNames?: string[]
	permissionKeys?: PermissionKey_BE<string>[]
}

export type DefaultDef_Package = {
	name: string
	domains: DefaultDef_Domain[]
	groups?: DefaultDef_Group[]
}