import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';

export const Locale_DbKey = 'locale--locales';
type DBKey = typeof Locale_DbKey;

type VersionTypes = { '1.0.0': DB_Locale };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes>;
type UniqueKeys = 'code';
type GeneratedKeys = '_language' | '_country';
type Dependencies = {};

export type DB_Locale = DB_Object<DBKey> & {
	code: string;
	displayName: string;
	enabled: boolean;
	_language: string;
	_country: string;
};

export type DatabaseDef_Locale = DB_Prototype<DB_ProtoSeed<DB_Locale, DBKey, GeneratedKeys, Versions, UniqueKeys, Dependencies>>;
export type UI_Locale = DatabaseDef_Locale['uiType'];
