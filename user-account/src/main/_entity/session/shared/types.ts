import {DB_Object, DBProto, Proto_DB_Object, TypedKeyValue, UniqueId, VersionsDeclaration} from '@nu-art/ts-common';

type VersionTypes = { '1.0.0': DB_Session };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes>
type UniqueIds = 'accountId' | 'deviceId';
type DBKey = 'user-account--sessions';
type GeneratedKeys = keyof DB_Object;

type Proto = Proto_DB_Object<DB_Session, DBKey, GeneratedKeys, Versions, UniqueIds>
export type DBProto_Session = DBProto<Proto>
export type UI_Session = DBProto_Session['uiType']

export type DB_Session = DB_Object & {
	label?: string
	accountId: string
	deviceId: string
	sessionId: string
	timestamp: number
	needToRefresh?: boolean
	prevSession?: string[]
}

export type SessionData_TTL = { timestamp: number, expiration: number, deviceId: string };
export type _SessionKey_SessionId = TypedKeyValue<'_id', UniqueId>
export type _SessionKey_Session = TypedKeyValue<'session', SessionData_TTL>
