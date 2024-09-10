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

export type DB_LoginAttempt = DB_Object & {
	accountId: UniqueId;
	count: number;
}