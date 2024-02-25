import {DB_Object, DBProto, Proto_DB_Object, VersionsDeclaration} from '@nu-art/ts-common';
import {FirebaseToken, PushSessionId} from '../types';
import {PushPubSubDBGroupType} from '../shared';


type VersionTypes_PushSession = { '1.0.0': DB_PushSession };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_PushSession>;
type Dependencies = {
//
}

type UniqueKeys = 'pushSessionId';
type Proto = Proto_DB_Object<DB_PushSession, 'push-session', PushPubSubDBGroupType, never, Versions, UniqueKeys, Dependencies>;

export type DBProto_PushSession = DBProto<Proto>;

export type UI_PushSession = DBProto_PushSession['uiType'];

export type DB_PushSession = DB_Object & FirebaseToken & PushSessionId & {
	timestamp: number
	accountId: string
}


