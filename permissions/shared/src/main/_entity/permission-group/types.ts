import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import {AuditableV2} from '@nu-art/user-account-shared';

export const PermissionGroup_DbKey = 'permissions--group';
type DBKey = typeof PermissionGroup_DbKey;

type VersionTypes_PermissionGroup = { '1.0.0': DB_PermissionGroup_1_0_0; '2.0.0': DB_PermissionGroup };
type Versions = VersionsDeclaration<['2.0.0', '1.0.0'], VersionTypes_PermissionGroup>;
type UniqueKeys = '_id';
type GeneratedProps = keyof AuditableV2;
type Dependencies = {};
type Proto = DB_ProtoSeed<DB_PermissionGroup, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DatabaseDef_PermissionGroup = DB_Prototype<Proto>;
export type UI_PermissionGroup = DatabaseDef_PermissionGroup['uiType'];
export type DB_PermissionGroup = DB_Object<DBKey> & AuditableV2 & {
	label: string;
	uiLabel: string;
	scopeEntries: string[];
};

export type DB_PermissionGroup_1_0_0 = DB_Object<DBKey> & AuditableV2 & {
	label: string;
	accessLevelIds: string[];
};
