import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';

export const PermissionScope_DbKey = 'permissions--scope';
type DBKey = typeof PermissionScope_DbKey;

type VersionTypes_PermissionScope = { '1.0.0': DB_PermissionScope };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_PermissionScope>;
type UniqueKeys = '_id';
type GeneratedProps = never;
type Dependencies = {};
type Proto = DB_ProtoSeed<DB_PermissionScope, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DatabaseDef_PermissionScope = DB_Prototype<Proto>;
export type UI_PermissionScope = DatabaseDef_PermissionScope['uiType'];
export type DB_PermissionScope = DB_Object<DBKey> & {
	key: string;
	value: string;
};
