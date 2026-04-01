import {DB_Object, DB_ProtoSeed, DB_Prototype, DBPointer, VersionsDeclaration} from '@nu-art/db-api-shared';
import type {DatabaseDef_PermissionScope} from '../permission-scope/types.js';

export type PermissionRoleType = 'personal' | 'assignable';

export const PermissionRole_DbKey = 'permissions--role';
type DBKey = typeof PermissionRole_DbKey;

type VersionTypes_PermissionRole = {
	'1.0.0': DB_PermissionRole;
};
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_PermissionRole>;
type UniqueKeys = '_id';
type GeneratedProps = never;
type Dependencies = { scopeEntries: DatabaseDef_PermissionScope };
type Proto = DB_ProtoSeed<DB_PermissionRole, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DatabaseDef_PermissionRole = DB_Prototype<Proto>;
export type UI_PermissionRole = DatabaseDef_PermissionRole['uiType'];

export type DB_PermissionRole = DB_Object<DBKey> & {
	label: string;
	type: PermissionRoleType;
	scopeEntries: DatabaseDef_PermissionScope['id'][];
	dbPointer?: DBPointer<string>[]
};