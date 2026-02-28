import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import {AuditableV2} from '@nu-art/user-account-shared';

export const PermissionProject_DbKey = 'permissions--project';
type DBKey = typeof PermissionProject_DbKey;

type VersionTypes_PermissionProject = { '1.0.0': DB_PermissionProject };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_PermissionProject>;
type UniqueKeys = '_id';
type GeneratedProps = '_auditorId';
type Dependencies = {};
type Proto = DB_ProtoSeed<DB_PermissionProject, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DatabaseDef_PermissionProject = DB_Prototype<Proto>;
export type UI_PermissionProject = DatabaseDef_PermissionProject['uiType'];
export type DB_PermissionProject = DB_Object<DBKey> & AuditableV2 & {
	name: string;
};
