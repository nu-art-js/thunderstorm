import {DB_PermissionAccessLevel, DB_PermissionDomain, DB_PermissionProject} from './management';
import {DB_PermissionGroup, DB_PermissionUser} from './assign';
import {TypedKeyValue, TypedMap} from '@nu-art/ts-common';

export type PermissionTypes = {
	Project: DB_PermissionProject;
	Domain: DB_PermissionDomain;
	Level: DB_PermissionAccessLevel;
	Group: DB_PermissionGroup;
	User: DB_PermissionUser;
}

export type SessionData_Permissions = TypedKeyValue<'permissions', TypedMap<number>>