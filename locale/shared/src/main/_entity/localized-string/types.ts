import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import type {DB_Locale, DatabaseDef_Locale} from '../locale/types.js';

export const LocalizedString_DbKey = 'locale--localized-strings';
type DBKey = typeof LocalizedString_DbKey;

type VersionTypes = { '1.0.0': DB_LocalizedString };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes>;
type UniqueKeys = '_id';
type GeneratedKeys = never;
type Dependencies = { localeId: DatabaseDef_Locale };

export type DB_LocalizedString = DB_Object<DBKey> & {
	localeId: DB_Locale['_id'];
	originId?: DB_LocalizedString['_id'];
	value: string;
};

export type DatabaseDef_LocalizedString = DB_Prototype<DB_ProtoSeed<DB_LocalizedString, DBKey, GeneratedKeys, Versions, UniqueKeys, Dependencies>>;
export type UI_LocalizedString = DatabaseDef_LocalizedString['uiType'];
