import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import {DB_Account} from '@nu-art/user-account-shared';

export const LoginStatus_Success = 'success';
export const LoginStatus_Failed = 'failed';
export type LoginStatus = typeof LoginStatus_Failed | typeof LoginStatus_Success

type VersionTypes_LoginAttempt = { '1.0.0': DB_LoginAttempt }
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_LoginAttempt>;
type Dependencies = {}
type UniqueKeys = '_id';
type GeneratedProps = never
type DBKey = 'login-attempt'
export type DatabaseDef_LoginAttempt = DB_Prototype<DB_ProtoSeed<DB_LoginAttempt, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>>;

export type UI_LoginAttempt = DatabaseDef_LoginAttempt['uiType'];

export type LoginMetadata = {
	ipAddress?: string;
	deviceId?: string;
}

export type DB_LoginAttempt = DB_Object<DBKey> & {
	accountId: DB_Account['_id'],
	status: LoginStatus,
	metadata: LoginMetadata
}
