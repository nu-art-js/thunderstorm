import {DB_Object, DBProto, Proto_DB_Object, VersionsDeclaration} from '@nu-art/ts-common';
import {BaseSubscriptionData, PushSessionId} from '../types';


type Versions = VersionsDeclaration<DB_PushSubscription, ['1.0.0'], [DB_PushSubscription]>;
type Dependencies = {
//
}

type UniqueKeys = '_id';
type Proto = Proto_DB_Object<DB_PushSubscription, never, Versions, UniqueKeys, Dependencies>;

export type DBProto_PushSubscription = DBProto<Proto>;

export type UI_PushSubscription = DBProto_PushSubscription['uiType'];
export type DB_PushSubscription = DB_Object & PushSessionId & BaseSubscriptionData

