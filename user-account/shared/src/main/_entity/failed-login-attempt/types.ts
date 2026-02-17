import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import {DB_Account} from '../account/index.js';

type VersionTypes_FailedLoginAttempt = { '1.0.0': DB_FailedLoginAttempt };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_FailedLoginAttempt>;
type Dependencies = {};
type UniqueKeys = '_id';
type GeneratedProps = never;
type DBKey = 'failed-login-attempt';
export type DatabaseDef_FailedLoginAttempt = DB_Prototype<DB_ProtoSeed<DB_FailedLoginAttempt, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>>;

export type UI_FailedLoginAttempt = DatabaseDef_FailedLoginAttempt['uiType'];

export type DB_FailedLoginAttempt = DB_Object<DBKey> & {
	accountId: DB_Account['_id'];
	count: number;
	loginSuccessfulAt?: number;
};
