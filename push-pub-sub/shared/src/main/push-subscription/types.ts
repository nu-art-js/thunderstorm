import {DB_Object, DB_Prototype, DB_ProtoSeed, VersionsDeclaration} from '@nu-art/db-api-shared';
import {BaseSubscriptionData, PushSessionId} from '../types.js';

export const PushSubscription_DbKey = 'push-subscription';
type DBKey = typeof PushSubscription_DbKey;
type VersionTypes_PushSubscription = { '1.0.0': DB_PushSubscription };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_PushSubscription>;
type Dependencies = {};
type UniqueKeys = '_id';
type GeneratedProps = never;

export type DB_PushSubscription = DB_Object<DBKey> & PushSessionId & BaseSubscriptionData;

export type DatabaseDef_PushSubscription = DB_Prototype<DB_ProtoSeed<DB_PushSubscription, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>>;
export type UI_PushSubscription = DatabaseDef_PushSubscription['uiType'];
