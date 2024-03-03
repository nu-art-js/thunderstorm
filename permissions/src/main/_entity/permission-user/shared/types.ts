import {AuditableV2, DB_Object, DBProto, Proto_DB_Object, VersionsDeclaration} from '@nu-art/ts-common';
import {DBProto_PermissionGroup} from '../../permission-group/shared';

type VersionTypes_PermissionUser = {
	'1.0.0': DB_PermissionUser
}
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_PermissionUser>;
type Dependencies = {
	'__groupIds': DBProto_PermissionGroup;
}

type UniqueKeys = '_id';
type GeneratedProps = '__groupIds' | '_auditorId'
type Proto = Proto_DB_Object<DB_PermissionUser, 'permissions--user', GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DBProto_PermissionUser = DBProto<Proto>;

export type UI_PermissionUser = DBProto_PermissionUser['uiType'];

export type User_Group = {
	groupId: string,
}

export type DB_PermissionUser = DB_Object & AuditableV2 & {
	groups: User_Group[],
	__groupIds?: string[]
}

