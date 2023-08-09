// export type DB_Testv1_0_0 = DB_Object & { a: string, k: string, _c: string, _d: number }
// export type DB_Test = DB_Object & { a: string, b: string, _c: string, _d: number }

// type Versions = VersionsDeclaration<DB_Test, ['1.0.1', '1.0.0'], [DB_Test, DB_Testv1_0_0]>
// type Proto_Test = Proto_DB_Object<DB_Test, '_c' | '_d', Versions, 'a'>

// export type DBProto_Test = DBProto<Proto_Test>


import {AuditableV2, DB_Object, TypedKeyValue, UniqueId} from '@nu-art/ts-common';
import {DBProto, Proto_DB_Object, VersionsDeclaration} from '@nu-art/ts-common/db/types';


export const _accountTypesV3 = ['user', 'service'];
export const accountTypesV3 = [..._accountTypesV3] as const;
export type AccountTypeV3 = typeof accountTypesV3[number];

export type DB_Session_V3 = DB_Object & {
	accountId: string
	sessionId: string
	timestamp: number
}

type VersionsSession = VersionsDeclaration<DB_Session_V3, ['1.0.0'], [DB_Session_V3]>
type Proto_Session = Proto_DB_Object<DB_Session_V3, keyof DB_Object, VersionsSession, 'accountId'>

export type DBProto_SessionType = DBProto<Proto_Session>
export type UI_Session = DBProto_SessionType['uiType']

type SessionData_TTL = { timestamp: number, expiration: number, };

export type _SessionKey_SessionIdV3 = TypedKeyValue<'_id', UniqueId>
export type _SessionKey_SessionV3 = TypedKeyValue<'session', SessionData_TTL>

export type DB_AccountV3 = DB_Object & AuditableV2 & {
	type: AccountTypeV3;
	email: string;
	displayName?: string
	thumbnail?: string
	salt?: string
	saltedPassword?: string
	_newPasswordRequired?: boolean
}



export type _SessionKey_AccountV3 = TypedKeyValue<'account', DB_AccountV3 & { hasPassword: boolean }>


type VersionsAccount = VersionsDeclaration<DB_AccountV3, ['1.0.0'], [DB_AccountV3]>;
type Proto_Account = Proto_DB_Object<DB_AccountV3, keyof DB_Object | keyof AuditableV2 | '_newPasswordRequired', VersionsAccount, 'email'>;

export type DBProto_AccountType = DBProto<Proto_Account>;
export type UI_AccountV3 = DBProto_AccountType['uiType'];