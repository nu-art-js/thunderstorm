import {DB_Object, DBProto, Proto_DB_Object, VersionsDeclaration} from '@thunder-storm/common';
import {BaseSubscriptionData, PushSessionId} from '../types';


type VersionTypes_PushSubscription = { '1.0.0': DB_PushSubscription };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_PushSubscription>;
type Dependencies = {
//
}

type UniqueKeys = '_id';
type Proto = Proto_DB_Object<DB_PushSubscription, 'push-subscription', never, Versions, UniqueKeys, Dependencies>;

export type DBProto_PushSubscription = DBProto<Proto>;

export type UI_PushSubscription = DBProto_PushSubscription['uiType'];
export type DB_PushSubscription = DB_Object & PushSessionId & BaseSubscriptionData

