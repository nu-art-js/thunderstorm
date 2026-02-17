import {CrudTypes, DatabasePrototype, DB_Object, Proto_DB_Object, VersionsDeclaration} from '@nu-art/db-api-shared';
import {DB_Account} from '../account/index.js';

type VersionTypes_FailedLoginAttempt = { '1.0.0': DB_FailedLoginAttempt };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_FailedLoginAttempt>;
type Dependencies = {};
type UniqueKeys = '_id';
type GeneratedProps = never;
type DBKey = 'failed-login-attempt';
type Proto = Proto_DB_Object<DB_FailedLoginAttempt, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;
export type DBProto_FailedLoginAttempt = DatabasePrototype<Proto>;

export type FailedLoginAttemptCrudTypes = CrudTypes<
	DBProto_FailedLoginAttempt['dbKey'],
	DBProto_FailedLoginAttempt['dbType'],
	DBProto_FailedLoginAttempt['uiType'],
	DBProto_FailedLoginAttempt['editableType'],
	DBProto_FailedLoginAttempt['modifiablePropsValidator'],
	DBProto_FailedLoginAttempt['uniqueKeys']
>;

export type UI_FailedLoginAttempt = DBProto_FailedLoginAttempt['uiType'];

export type DB_FailedLoginAttempt = DB_Object<DBKey> & {
	accountId: DB_Account['_id'];
	count: number;
	loginSuccessfulAt?: number;
};
