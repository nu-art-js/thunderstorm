import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import {DatabaseDef_PermissionProject} from '../permission-project/types.js';
import {AuditableV2} from '@nu-art/user-account-shared';

export const PermissionDomain_DbKey = 'permissions--domain';
type DBKey = typeof PermissionDomain_DbKey;

type VersionTypes_PermissionDomain = { '1.0.0': DB_PermissionDomain };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_PermissionDomain>;
type UniqueKeys = '_id';
type GeneratedProps = '_auditorId';
type Dependencies = { projectId: DatabaseDef_PermissionProject };
type Proto = DB_ProtoSeed<DB_PermissionDomain, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DatabaseDef_PermissionDomain = DB_Prototype<Proto>;
export type UI_PermissionDomain = DatabaseDef_PermissionDomain['uiType'];
export type DB_PermissionDomain = DB_Object<DBKey> & AuditableV2 & {
	projectId: DatabaseDef_PermissionProject['id'];
	namespace: string;
};
