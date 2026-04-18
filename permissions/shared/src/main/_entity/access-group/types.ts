import type {UniqueId} from '@nu-art/ts-common';
import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import type {DatabaseDef_PermissionScope} from '../permission-scope/types.js';

export type AccessGroupType = 'user' | 'service-account' | 'entity' | 'custom';

export const AccessGroup_DbKey = 'permissions--access-groups';
type DBKey = typeof AccessGroup_DbKey;

type VersionTypes_AccessGroup = { '1.0.0': DB_AccessGroup };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_AccessGroup>;
type UniqueKeys = '_id';
type GeneratedProps = never;
type Dependencies = { scopeEntries: DatabaseDef_PermissionScope };
type Proto = DB_ProtoSeed<DB_AccessGroup, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DatabaseDef_AccessGroup = DB_Prototype<Proto>;
export type UI_AccessGroup = DatabaseDef_AccessGroup['uiType'];

export type DB_AccessGroup = DB_Object<DBKey> & {
	type: AccessGroupType;
	key: string;
	label: string;
	members: UniqueId[];
	scopeEntries?: DatabaseDef_PermissionScope['id'][];
};
