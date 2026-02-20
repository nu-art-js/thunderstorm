import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';

export const Topic_DbKey = 'topics';
type DBKey = typeof Topic_DbKey;

type VersionTypes_Topic = {'1.0.0': DB_Topic};
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_Topic>;
type UniqueKeys = '_id';
type GeneratedKeys = 'type' | 'refId';
type Dependencies = {};
type Proto = DB_ProtoSeed<DB_Topic, DBKey, GeneratedKeys, Versions, UniqueKeys, Dependencies>;

export type DB_Topic = DB_Object<DBKey> & {
	type: string;
	refId: string;
};

export type DatabaseDef_Topic = DB_Prototype<Proto>;
export type UI_Topic = DatabaseDef_Topic['uiType'];
