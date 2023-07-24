import {AuditableV2, DB_Object} from '@nu-art/ts-common';

export type DB_Session_V2 = DB_Object & {
	userId: string
	sessionId: string
	timestamp: number
}

export type DB_Account_V2 = DB_Object & AuditableV2 & {
	email: string

	salt?: string
	saltedPassword?: string
}
