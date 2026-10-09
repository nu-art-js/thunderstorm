import type {LocaleRegister} from './locale-code.js';
import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';

export const Locale_DbKey = 'i18n--locales';
type DBKey = typeof Locale_DbKey;

type VersionTypes = { '1.0.0': DB_Locale };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes>;
type UniqueKeys = 'code';
type GeneratedKeys = '_language' | '_country';
type Dependencies = {};

export type DB_Locale = DB_Object<DBKey> & {
	/** Unique identity of the locale (`ll` or `ll_CC`); the document id is derived from it and it cannot change. */
	code: string;
	displayName: string;
	enabled: boolean;
	/** Register this locale's texts are written in. Metadata for translators and agents; not used in resolution. */
	register?: LocaleRegister;
	_language: string;
	_country: string;
};

export type DatabaseDef_Locale = DB_Prototype<DB_ProtoSeed<DB_Locale, DBKey, GeneratedKeys, Versions, UniqueKeys, Dependencies>>;
export type UI_Locale = DatabaseDef_Locale['uiType'];
