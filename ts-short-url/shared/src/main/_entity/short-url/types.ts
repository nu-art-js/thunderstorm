import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';

export const ShortUrl_DbKey = 'short-url';
type DBKey = typeof ShortUrl_DbKey;

type VersionTypes_ShortUrl = { '1.0.0': DB_ShortUrl };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_ShortUrl>;
type UniqueKeys = '_id';
type GeneratedKeys = '_shortUrl';
type Dependencies = {};

export type DB_ShortUrl = DB_Object<DBKey> & {
	fullUrl: string;
	title: string;
	description?: string;
	_shortUrl: string;
};

/** Previously DBProto_ShortUrl; use DatabaseDef_ShortUrl everywhere. */
export type DatabaseDef_ShortUrl = DB_Prototype<DB_ProtoSeed<DB_ShortUrl, DBKey, GeneratedKeys, Versions, UniqueKeys, Dependencies>>;
export type UI_ShortUrl = DatabaseDef_ShortUrl['uiType'];
