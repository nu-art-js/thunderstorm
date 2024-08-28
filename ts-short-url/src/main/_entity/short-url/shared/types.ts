import {DB_Object, DBProto, Proto_DB_Object, VersionsDeclaration} from '@thunder-storm/common';

type VersionTypes_ShortUrl = { '1.0.0': DB_ShortUrl }
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_ShortUrl>;
type Dependencies = {}
type UniqueKeys = '_id';
type GeneratedProps = '_shortUrl'
type DBKey = 'short-url'
type Proto = Proto_DB_Object<DB_ShortUrl, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;
export type DBProto_ShortUrl = DBProto<Proto>;
export type UI_ShortUrl = DBProto_ShortUrl['uiType'];

export type DB_ShortUrl = DB_Object & {
	fullUrl: string,
	title: string,
	description?: string
	_shortUrl: string,
}
