import {AuditableV2, DB_Object, DBProto, Proto_DB_Object, UniqueId, VersionsDeclaration} from '@thunder-storm/common';
import {DBProto_PermissionProject} from '../../permission-project/shared';
import {DBProto_PermissionAccessLevel} from '../../permission-access-level/shared';

type VersionTypes_PermissionAPI = {
	'1.0.0': DB_PermissionAPI,
	'1.0.1': DB_PermissionAPI,
}
type Versions = VersionsDeclaration<['1.0.1', '1.0.0'], VersionTypes_PermissionAPI>;
type Dependencies = {
	projectId: DBProto_PermissionProject;
	accessLevelIds: DBProto_PermissionAccessLevel;
}

type UniqueKeys = 'projectId' | 'path'
type GeneratedProps = '_auditorId' | '_accessLevels'
type Proto = Proto_DB_Object<DB_PermissionAPI, 'permissions--api', GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DBProto_PermissionAPI = DBProto<Proto>;

export type UI_PermissionAPI = DBProto_PermissionAPI['uiType'];
export type DB_PermissionAPI = DB_Object & AuditableV2 & {
	projectId: string
	path: string
	accessLevelIds?: string[],
	deprecated?: boolean,
	onlyForApplication?: boolean
	_accessLevels?: DomainToLevelValueMap
}

export type DomainToLevelValueMap = { [domainId: UniqueId]: number };
