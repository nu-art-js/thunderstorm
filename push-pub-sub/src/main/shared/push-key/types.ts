import {DB_Object, DBProto, Proto_DB_Object, VersionsDeclaration} from '@nu-art/ts-common';
import {BaseSubscriptionData, PushSessionId} from '../types';


type Versions = VersionsDeclaration<DB_PushKeys, ['1.0.0'], [DB_PushKeys]>;
type Dependencies = {
//
}

type UniqueKeys = '_id';
type Proto = Proto_DB_Object<DB_PushKeys, never, Versions, UniqueKeys, Dependencies>;

export type DBProto_PushKeys = DBProto<Proto>;

export type UI_PushKeys = DBProto_PushKeys['uiType'];
export type DB_PushKeys = DB_Object & PushSessionId & BaseSubscriptionData

