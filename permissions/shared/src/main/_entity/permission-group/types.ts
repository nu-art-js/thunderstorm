import {TypedMap} from '@nu-art/ts-common';
import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import {DatabaseDef_PermissionProject} from '../permission-project/types.js';
import {DatabaseDef_PermissionAccessLevel} from '../permission-access-level/types.js';

export const PermissionGroup_DbKey = 'permissions--group';
type DBKey = typeof PermissionGroup_DbKey;

type VersionTypes_PermissionGroup = {'1.0.0': DB_PermissionGroup; '1.0.1': DB_PermissionGroup};
type Versions = VersionsDeclaration<['1.0.1', '1.0.0'], VersionTypes_PermissionGroup>;
type UniqueKeys = '_id';
// type GeneratedProps = '_levelsMap';
type GeneratedProps = never;
type Dependencies = {projectId: DatabaseDef_PermissionProject; accessLevelIds: DatabaseDef_PermissionAccessLevel};
type Proto = DB_ProtoSeed<DB_PermissionGroup, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DatabaseDef_PermissionGroup = DB_Prototype<Proto>;
export type UI_PermissionGroup = DatabaseDef_PermissionGroup['uiType'];
export type DB_PermissionGroup = DB_Object<DBKey> & {
	projectId?: DatabaseDef_PermissionProject['id'];
	label: string;
	uiLabel: string;
	accessLevelIds: DatabaseDef_PermissionAccessLevel['id'][];
	_levelsMap?: TypedMap<number>;
};

export type DB_PermissionGroup_1_0_0 = DB_Object<DBKey> & {
	projectId?: DatabaseDef_PermissionProject['id'];
	label: string;
	accessLevelIds: DatabaseDef_PermissionAccessLevel['id'][];
	_levelsMap?: TypedMap<number>;
};
