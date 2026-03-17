import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import {DatabaseDef_PermissionAccessLevel} from '../permission-access-level/types.js';
import {DatabaseDef_PermissionDomain} from '../permission-domain/types.js';
import {DatabaseDef_PermissionProject} from '../permission-project/types.js';
import {AuditableV2} from '@nu-art/user-account-shared';

export const PermissionAPI_DbKey = 'permissions--api';
type DBKey = typeof PermissionAPI_DbKey;

type VersionTypes_PermissionAPI = { '1.0.0': DB_PermissionAPI; '1.0.1': DB_PermissionAPI };
type Versions = VersionsDeclaration<['1.0.1', '1.0.0'], VersionTypes_PermissionAPI>;
type UniqueKeys = 'projectId' | 'path';
type GeneratedProps = '_auditorId' | '_accessLevels';
type Dependencies = { projectId: DatabaseDef_PermissionProject; accessLevelIds: DatabaseDef_PermissionAccessLevel };
type Proto = DB_ProtoSeed<DB_PermissionAPI, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DatabaseDef_PermissionAPI = DB_Prototype<Proto>;
export type UI_PermissionAPI = DatabaseDef_PermissionAPI['uiType'];

/** @deprecated API collection deprecated; use function-based permissions and @RequirePermission. */
export type DB_PermissionAPI = DB_Object<DBKey> & AuditableV2 & {
	projectId: DatabaseDef_PermissionProject['id'];
	path: string;
	accessLevelIds?: DatabaseDef_PermissionAccessLevel['id'][];
	deprecated?: boolean;
	onlyForApplication?: boolean;
	_accessLevels?: DomainToLevelValueMap;
};

export type DomainToLevelValueMap = { [domainId: DatabaseDef_PermissionDomain['id']]: number };
