import {DB_Object, DBProto, Proto_DB_Object, VersionsDeclaration} from '@nu-art/ts-common';
import {FirebaseToken, PushSessionId} from '../types';


type Versions = VersionsDeclaration<DB_PushRegistration, ['1.0.0'], [DB_PushRegistration]>;
type Dependencies = {
//
}

type UniqueKeys = 'pushSessionId';
type Proto = Proto_DB_Object<DB_PushRegistration, never, Versions, UniqueKeys, Dependencies>;

export type DBProto_PushRegistration = DBProto<Proto>;

export type UI_PushRegistration = DBProto_PushRegistration['uiType'];

export type DB_PushRegistration = DB_Object & FirebaseToken & PushSessionId & {
	timestamp: number
	accountId: string
}


