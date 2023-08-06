import {AuditableV2, DB_Object, TypedKeyValue, UniqueId} from '@nu-art/ts-common';


export const accountTypes = ['user', 'service'] as const;
export type AccountType = typeof accountTypes[number];

export type DB_Session_V2 = DB_Object & {
	accountId: string
	sessionId: string
	timestamp: number
}

//TODO: Remove when moving to proto
export type UI_Account = DB_Object & {
	type: AccountType;
	email: string;

	displayName?: string
	thumbnail?: string

	_newPasswordRequired?: boolean
}

export type DB_Account_V2 = AuditableV2 & UI_Account & {
	salt?: string
	saltedPassword?: string
}

export type _SessionKey_SessionId = TypedKeyValue<'_id', UniqueId>

export type _SessionKey_Account = TypedKeyValue<'account', UI_Account & { hasPassword: boolean }>

type SessionData_TTL = { timestamp: number, expiration: number, };

export type _SessionKey_Session = TypedKeyValue<'session', SessionData_TTL>