import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import {DatabaseDef_PermissionDomain} from '../permission-domain/types.js';

export const PermissionAccessLevel_DbKey = 'permissions--level';
type DBKey = typeof PermissionAccessLevel_DbKey;

type VersionTypes_PermissionAccessLevel = { '1.0.0': DB_PermissionAccessLevel; '1.0.1': DB_PermissionAccessLevel };
type Versions = VersionsDeclaration<['1.0.1', '1.0.0'], VersionTypes_PermissionAccessLevel>;
type UniqueKeys = '_id';
type GeneratedProps = '_auditorId';
type Dependencies = { domainId: DatabaseDef_PermissionDomain };
type Proto = DB_ProtoSeed<DB_PermissionAccessLevel, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DatabaseDef_PermissionAccessLevel = DB_Prototype<Proto>;
export type UI_PermissionAccessLevel = DatabaseDef_PermissionAccessLevel['uiType'];

export type Base_AccessLevel = {
	domainId: DatabaseDef_PermissionDomain['id'];
	value: number;
};

export type DB_PermissionAccessLevel = DB_Object<DBKey> & Base_AccessLevel & {
	name: string;
	uiLabel: string;
	_auditorId?: string;
};

export type DB_PermissionAccessLevel_1_0_0 = DB_Object<DBKey> & Base_AccessLevel & {
	name: string;
};
