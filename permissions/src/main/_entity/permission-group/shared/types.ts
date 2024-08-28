import {AuditableV2, DB_Object, DBProto, Proto_DB_Object, TypedMap, VersionsDeclaration} from '@thunder-storm/common';
import {DBProto_PermissionProject} from '../../permission-project/shared';
import {DBProto_PermissionAccessLevel} from '../../permission-access-level/shared';

type VersionTypes_PermissionGroup = {
	'1.0.0': DB_PermissionGroup
	'1.0.1': DB_PermissionGroup
}
type Versions = VersionsDeclaration<['1.0.1', '1.0.0'], VersionTypes_PermissionGroup>;
type Dependencies = {
	projectId: DBProto_PermissionProject;
	accessLevelIds: DBProto_PermissionAccessLevel;
}

type UniqueKeys = '_id';
type GeneratedProps = '_levelsMap' | '_auditorId';
type Proto = Proto_DB_Object<DB_PermissionGroup, 'permissions--group', GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DBProto_PermissionGroup = DBProto<Proto>;

export type UI_PermissionGroup = DBProto_PermissionGroup['uiType'];
export type DB_PermissionGroup = DB_Object & AuditableV2 & {
	projectId?: string
	label: string, // name, refactor into 'key'
	uiLabel: string, // name of the group to show in UI
	accessLevelIds: string[],
	_levelsMap?: TypedMap<number>, // [DomainId]: AccessLevel.value
}

export type DB_PermissionGroup_1_0_0 = DB_Object & AuditableV2 & {
	projectId?: string
	label: string, // name, refactor into 'key'
	accessLevelIds: string[],
	_levelsMap?: TypedMap<number>, // [DomainId]: AccessLevel.value
}