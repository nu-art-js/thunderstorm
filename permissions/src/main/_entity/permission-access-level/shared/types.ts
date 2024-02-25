import {AuditableV2, DB_Object, DBProto, Proto_DB_Object, VersionsDeclaration} from '@nu-art/ts-common';
import {DBProto_PermissionDomain} from '../../permission-domain/shared/types';
import {PermissionDBGroupType} from '../../shared';

type VersionTypes_PermissionAccessLevel = {
	'1.0.0': DB_PermissionAccessLevel
}
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_PermissionAccessLevel>;
type Dependencies = {
	domainId: DBProto_PermissionDomain
}

type UniqueKeys = '_id';
type GeneratedProps = '_auditorId'
type Proto = Proto_DB_Object<DB_PermissionAccessLevel, 'permissions--level', PermissionDBGroupType, GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DBProto_PermissionAccessLevel = DBProto<Proto>;

export type UI_PermissionAccessLevel = DBProto_PermissionAccessLevel['uiType'];

export type Base_AccessLevel = {
	domainId: string,
	value: number
}

export type DB_PermissionAccessLevel = DB_Object & Base_AccessLevel & AuditableV2 & {
	name: string
}

