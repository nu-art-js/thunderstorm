// export type DB_Testv1_0_0 = DB_Object & { a: string, k: string, _c: string, _d: number }
// export type DB_Test = DB_Object & { a: string, b: string, _c: string, _d: number }

// type Versions = VersionsDeclaration<DB_Test, ['1.0.1', '1.0.0'], [DB_Test, DB_Testv1_0_0]>
// type Proto_Test = Proto_DB_Object<DB_Test, '_c' | '_d', Versions, 'a'>

// export type DBProto_Test = DBProto<Proto_Test>

import {AuditableV2, DB_BaseObject, DB_Object, TypedKeyValue, UniqueId} from '@nu-art/ts-common';
import {DBProto, Proto_DB_Object, VersionsDeclaration} from '@nu-art/ts-common/db/types';
import {accountTypes} from './consts';


export type AccountType = typeof accountTypes[number];

export type DB_Session = DB_Object & {
	accountId: string
	sessionId: string
	timestamp: number
}

type VersionsSession = VersionsDeclaration<DB_Session, ['1.0.0'], [DB_Session]>
type Proto_Session = Proto_DB_Object<DB_Session, keyof DB_Object, VersionsSession, 'accountId'>

export type DBProto_SessionType = DBProto<Proto_Session>
export type UI_Session = DBProto_SessionType['uiType']

export type _SessionKey_SessionId = TypedKeyValue<'_id', UniqueId>
type SessionData_TTL = { timestamp: number, expiration: number, };
export type _SessionKey_Session = TypedKeyValue<'session', SessionData_TTL>

export type DB_Account = DB_Object & AuditableV2 & {
	type: AccountType;
	email: string;
	displayName?: string
	thumbnail?: string
	salt?: string
	saltedPassword?: string
	_newPasswordRequired?: boolean
}

export type SessionData_HasPassword = { hasPassword: boolean };
export type _SessionKey_Account = TypedKeyValue<'account', UI_Account & DB_BaseObject & SessionData_HasPassword>

type VersionsAccount = VersionsDeclaration<DB_Account, ['1.0.0'], [DB_Account]>;
type GeneratedKeys = keyof AuditableV2 | '_newPasswordRequired' | 'salt' | 'saltedPassword';

export type Proto_Account = Proto_DB_Object<DB_Account, GeneratedKeys, VersionsAccount>;

export type DBProto_AccountType = DBProto<Proto_Account>;
export type UI_Account = DBProto_AccountType['uiType'];