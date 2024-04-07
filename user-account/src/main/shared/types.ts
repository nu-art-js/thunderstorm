// export type DB_Testv1_0_0 = DB_Object & { a: string, k: string, _c: string, _d: number }
// export type DB_Test = DB_Object & { a: string, b: string, _c: string, _d: number }

// type Versions = VersionsDeclaration< ['1.0.1', '1.0.0'], [DB_Test, DB_Testv1_0_0]>
// type Proto_Test = Proto_DB_Object<DB_Test, '_c' | '_d', Versions, 'a'>

// export type DBProto_Test = DBProto<Proto_Test>

import {DB_Object, TypedKeyValue, UniqueId} from '@nu-art/ts-common';
import {DBProto, Proto_DB_Object, VersionsDeclaration} from '@nu-art/ts-common/db/types';


export type DB_Session = DB_Object & {
	label?: string
	accountId: string
	deviceId: string
	sessionId: string
	timestamp: number
	needToRefresh?: boolean
	prevSession?: string[]
}

type VersionTypes_Sessions = { '1.0.0': DB_Session };
type VersionsSession = VersionsDeclaration<['1.0.0'], VersionTypes_Sessions>
type Proto_Session = Proto_DB_Object<DB_Session, 'user-account--sessions', keyof DB_Object, VersionsSession, 'accountId' | 'deviceId'>

export type DBProto_Session = DBProto<Proto_Session>
export type UI_Session = DBProto_Session['uiType']

export type _SessionKey_SessionId = TypedKeyValue<'_id', UniqueId>
type SessionData_TTL = { timestamp: number, expiration: number, deviceId: string };
export type _SessionKey_Session = TypedKeyValue<'session', SessionData_TTL>







