import {AuditableV2, DB_Object, DBProto, Proto_DB_Object, VersionsDeclaration} from '@thunder-storm/common';

type VersionTypes_PermissionProject = {
	'1.0.0': DB_PermissionProject
}
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_PermissionProject>;
type Dependencies = {}

type UniqueKeys = '_id';
type GeneratedProps = '_auditorId';
type Proto = Proto_DB_Object<DB_PermissionProject, 'permissions--project', GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DBProto_PermissionProject = DBProto<Proto>;

export type UI_PermissionProject = DBProto_PermissionProject['uiType'];
export type DB_PermissionProject = DB_Object & AuditableV2 & {
	name: string,
}

