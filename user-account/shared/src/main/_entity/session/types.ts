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
	// the md5s of the previous session associated with this session for quick query
	validSessionJwtMd5s: UniqueId[]

	label?: string
	accountId: UniqueId
	deviceId: UniqueId
	// when refreshing a session we are getting a new session object, this is the session id of the db session the new session was created from
	linkedSessionId?: UniqueId
	sessionIdJwt: string //jwt
}

export type _SessionKey_SessionId = TypedKeyValue<'_id', UniqueId>
