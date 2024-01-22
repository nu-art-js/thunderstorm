import {AuditableV2, DB_Object, DBProto, Proto_DB_Object, UniqueId, VersionsDeclaration} from '@nu-art/ts-common';

type VersionTypes_PermissionAPI = {
	'1.0.0': DB_PermissionAPI
}
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_PermissionAPI>;
type Dependencies = {}

type UniqueKeys = 'projectId' | 'path'
type GeneratedProps = '_auditorId' | '_accessLevels'
type Proto = Proto_DB_Object<DB_PermissionAPI, GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DBProto_PermissionAPI = DBProto<Proto>;

export type UI_PermissionAPI = DBProto_PermissionAPI['uiType'];
export type DB_PermissionAPI = DB_Object & AuditableV2 & {
	projectId: string
	path: string
	accessLevelIds?: string[],
	deprecated?: boolean,
	onlyForApplication?: boolean
	_accessLevels?: { [k: UniqueId]: number }
}

