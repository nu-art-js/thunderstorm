import {AuditableV2} from '@nu-art/ts-common';
import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import {DatabaseDef_PermissionGroup} from '../permission-group/types.js';

export const PermissionUser_DbKey = 'permissions--user';
type DBKey = typeof PermissionUser_DbKey;

type VersionTypes_PermissionUser = {'1.0.0': DB_PermissionUser};
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_PermissionUser>;
type UniqueKeys = '_id';
type GeneratedProps = '__groupIds' | '_auditorId';
type Dependencies = {'__groupIds': DatabaseDef_PermissionGroup};
type Proto = DB_ProtoSeed<DB_PermissionUser, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DatabaseDef_PermissionUser = DB_Prototype<Proto>;
export type UI_PermissionUser = DatabaseDef_PermissionUser['uiType'];

export type User_Group = {
	groupId: DatabaseDef_PermissionGroup['id'];
};

export type DB_PermissionUser = DB_Object<DBKey> & AuditableV2 & {
	groups: User_Group[];
	__groupIds?: DatabaseDef_PermissionGroup['id'][];
};
