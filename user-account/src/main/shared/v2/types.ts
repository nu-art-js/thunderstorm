import {AuditableV2, DB_Object} from '@nu-art/ts-common';

export const accountTypes = ['user', 'service'] as const;
export type AccountType = typeof accountTypes[number];

export type DB_Session_V2 = DB_Object & {
	accountId: string
	sessionId: string
	timestamp: number
}

export type DB_Account_V2 = DB_Object & AuditableV2 & {
	email: string
	type: AccountType;

	salt?: string
	saltedPassword?: string

	displayName?: string
	thumbnail?: string
}
