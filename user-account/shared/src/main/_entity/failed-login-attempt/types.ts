import {CrudTypes} from '@nu-art/db-api-shared';
import {DB_Object, DBProto, Proto_DB_Object, UniqueId, VersionsDeclaration} from '@nu-art/ts-common';

type VersionTypes_FailedLoginAttempt = { '1.0.0': DB_FailedLoginAttempt }
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_FailedLoginAttempt>;
type Dependencies = {}
type UniqueKeys = '_id';
type GeneratedProps = never
type DBKey = 'failed-login-attempt'
type Proto = Proto_DB_Object<DB_FailedLoginAttempt, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;
export type DBProto_FailedLoginAttempt = DBProto<Proto>;

export type FailedLoginAttemptCrudTypes = CrudTypes<
	DBProto_FailedLoginAttempt['dbKey'],
	// @ts-expect-error _id type mismatch (ts-common vs db-api-shared)
	DBProto_FailedLoginAttempt['dbType'],
	DBProto_FailedLoginAttempt['uiType'],
	DBProto_FailedLoginAttempt['modifiablePropsValidator'],
	DBProto_FailedLoginAttempt['uniqueKeys']
>;

export type UI_FailedLoginAttempt = DBProto_FailedLoginAttempt['uiType'];

export type DB_FailedLoginAttempt = DB_Object & {
	accountId: UniqueId;
	count: number;
	loginSuccessfulAt?: number
}