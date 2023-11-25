import {DB_Object, DBProto, Proto_DB_Object, VersionsDeclaration} from '@nu-art/ts-common';


type VersionTypes_PushMessagesHistory = { '1.0.0': DB_PushMessagesHistory };
type Versions = VersionsDeclaration<DB_PushMessagesHistory, ['1.0.0'], VersionTypes_PushMessagesHistory>;
type Dependencies = {
//
}

type UniqueKeys = '_id';
type GeneratedKeys =
	'pushSessionId' |
	'token' |
	'message' |
	'read' |
	'originatingAccountId';

type Proto = Proto_DB_Object<DB_PushMessagesHistory, GeneratedKeys, Versions, UniqueKeys, Dependencies>;

export type DBProto_PushMessagesHistory = DBProto<Proto>;

export type UI_PushMessagesHistory = DBProto_PushMessagesHistory['uiType'];
export type DB_PushMessagesHistory = DB_Object & {
	pushSessionId: string
	token: string
	message: any
	read: boolean
	originatingAccountId: string
}

