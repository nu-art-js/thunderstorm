import {DB_Object, DBProto, Proto_DB_Object, UniqueId, VersionsDeclaration} from '@nu-art/ts-common';

type VersionTypes_LoginAttempt = { '1.0.0': DB_LoginAttempt }
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_LoginAttempt>;
type Dependencies = {}
type UniqueKeys = '_id';
type GeneratedProps = never
type DBKey = 'login-attempt'
type Proto = Proto_DB_Object<DB_LoginAttempt, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;
export type DBProto_LoginAttempt = DBProto<Proto>;
export type UI_LoginAttempt = DBProto_LoginAttempt['uiType'];

// login statuses
export const LoginStatus_Success = 'success';
export const LoginStatus_Failed = 'failed';
export type LoginStatus = typeof LoginStatus_Failed | typeof LoginStatus_Success


//login metadata - TODO: understand and extend
export type LoginMetadata = {
	ipAddress?: string;
	deviceId?: string;
}

export type DB_LoginAttempt = DB_Object & {
	accountId: UniqueId,
	status: LoginStatus,
	metadata: LoginMetadata
}