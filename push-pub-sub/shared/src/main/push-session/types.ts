import {DB_Object, DB_Prototype, DB_ProtoSeed, VersionsDeclaration} from '@nu-art/db-api-shared';
import {FirebaseToken, PushSessionId} from '../types.js';

export const PushSession_DbKey = 'push-session';
type DBKey = typeof PushSession_DbKey;
type VersionTypes_PushSession = { '1.0.0': DB_PushSession };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_PushSession>;
type Dependencies = {};
type UniqueKeys = 'pushSessionId';
type GeneratedProps = never;

export type DB_PushSession = DB_Object<DBKey> & FirebaseToken & PushSessionId & {
	timestamp: number
	accountId: string
};

export type DatabaseDef_PushSession = DB_Prototype<DB_ProtoSeed<DB_PushSession, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>>;
export type UI_PushSession = DatabaseDef_PushSession['uiType'];
