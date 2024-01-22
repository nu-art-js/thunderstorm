import {AuditableV2, DB_Object, DBProto, Proto_DB_Object, TypedMap, VersionsDeclaration} from '@nu-art/ts-common';

type VersionTypes_PermissionGroup = {
	'1.0.0': DB_PermissionGroup
}
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_PermissionGroup>;
type Dependencies = {}

type UniqueKeys = '_id';
type GeneratedProps = '_levelsMap' | '_auditorId';
type Proto = Proto_DB_Object<DB_PermissionGroup, GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DBProto_PermissionGroup = DBProto<Proto>;

export type UI_PermissionGroup = DBProto_PermissionGroup['uiType'];
export type DB_PermissionGroup = DB_Object & AuditableV2 & {
	projectId?: string
	label: string,
	accessLevelIds: string[],
	_levelsMap?: TypedMap<number>, // [DomainId]: AccessLevel.value
}