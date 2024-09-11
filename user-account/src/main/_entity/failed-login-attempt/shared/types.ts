import {DB_Object, DBProto, Proto_DB_Object, VersionsDeclaration} from '@nu-art/ts-common';

type VersionTypes_FailedLoginAttempt = { '1.0.0': DB_FailedLoginAttempt }
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_FailedLoginAttempt>;
type Dependencies = {}
type UniqueKeys = '_id';
type GeneratedProps = never
type DBKey = 'failed-login-attempt'
type Proto = Proto_DB_Object<DB_FailedLoginAttempt, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;
export type DBProto_FailedLoginAttempt = DBProto<Proto>;
export type UI_FailedLoginAttempt = DBProto_FailedLoginAttempt['uiType'];

export type DB_FailedLoginAttempt = DB_Object & {
	count: number;
}