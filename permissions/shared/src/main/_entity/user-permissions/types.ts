import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';

export const UserPermissions_DbKey = 'permissions--user-permissions';
type DBKey = typeof UserPermissions_DbKey;

type VersionTypes_UserPermissions = { '1.0.0': DB_UserPermissions };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_UserPermissions>;
type UniqueKeys = '_id';
type GeneratedProps = never;
type Dependencies = {};
type Proto = DB_ProtoSeed<DB_UserPermissions, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DatabaseDef_UserPermissions = DB_Prototype<Proto>;
export type UI_UserPermissions = DatabaseDef_UserPermissions['uiType'];

export type DB_UserPermissions = DB_Object<DBKey> & {
	scopeEntries: string[];
};
