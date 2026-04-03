import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import {DBPointer} from '@nu-art/ts-common';
import {DatabaseDef_PermissionRole} from '../permission-role/types.js';

export const PermissionUser_DbKey = 'permissions--user';
type DBKey = typeof PermissionUser_DbKey;

type VersionTypes_PermissionUser = { '1.0.0': DB_PermissionUser };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_PermissionUser>;
type UniqueKeys = '_id';
type GeneratedProps = '__roleIds';
type Dependencies = { '__roleIds': DatabaseDef_PermissionRole };
type Proto = DB_ProtoSeed<DB_PermissionUser, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DatabaseDef_PermissionUser = DB_Prototype<Proto>;
export type UI_PermissionUser = DatabaseDef_PermissionUser['uiType'];

export type RoleAssignment = {
	roleId: DatabaseDef_PermissionRole['id'];
	context?: DBPointer[];
};

export type DB_PermissionUser = DB_Object<DBKey> & {
	roles: RoleAssignment[];
	__roleIds?: DatabaseDef_PermissionRole['id'][];
};
