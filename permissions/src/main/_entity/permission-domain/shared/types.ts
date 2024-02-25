import {AuditableV2, DB_Object, DBProto, Proto_DB_Object, VersionsDeclaration} from '@nu-art/ts-common';
import {DBProto_PermissionProject} from '../../permission-project/shared';
import {PermissionDBGroupType} from '../../shared';

type VersionTypes_PermissionDomain = {
	'1.0.0': DB_PermissionDomain
}
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_PermissionDomain>;
type Dependencies = {
	projectId: DBProto_PermissionProject;
}

type UniqueKeys = '_id';
type GeneratedProps = '_auditorId'
type Proto = Proto_DB_Object<DB_PermissionDomain, 'permissions--domain', PermissionDBGroupType, GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DBProto_PermissionDomain = DBProto<Proto>;

export type UI_PermissionDomain = DBProto_PermissionDomain['uiType'];
export type DB_PermissionDomain = DB_Object & AuditableV2 & {
	projectId: string
	namespace: string
}

