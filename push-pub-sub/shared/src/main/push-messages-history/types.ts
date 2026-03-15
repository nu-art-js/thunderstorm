import {DB_Object, DB_Prototype, DB_ProtoSeed, VersionsDeclaration} from '@nu-art/db-api-shared';

export const PushMessagesHistory_DbKey = 'push-messages-history';
type DBKey = typeof PushMessagesHistory_DbKey;
type VersionTypes_PushMessagesHistory = { '1.0.0': DB_PushMessagesHistory };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_PushMessagesHistory>;
type Dependencies = {};
type UniqueKeys = '_id';
type GeneratedKeys = 'pushSessionId' | 'token' | 'message' | 'read' | 'originatingAccountId';

export type DB_PushMessagesHistory = DB_Object<DBKey> & {
	pushSessionId: string
	token: string
	message: any
	read: boolean
	originatingAccountId: string
};

export type DatabaseDef_PushMessagesHistory = DB_Prototype<DB_ProtoSeed<DB_PushMessagesHistory, DBKey, GeneratedKeys, Versions, UniqueKeys, Dependencies>>;
export type UI_PushMessagesHistory = DatabaseDef_PushMessagesHistory['uiType'];
