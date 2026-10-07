import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import type {DB_Locale, DatabaseDef_Locale} from '../locale/types.js';
import type {I18N_Forms} from '../../register.js';

export const I18nOverlay_DbKey = 'i18n--overlays';
type DBKey = typeof I18nOverlay_DbKey;

type VersionTypes = { '1.0.0': DB_I18nOverlay };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes>;
type UniqueKeys = '_id';
type GeneratedKeys = never;
type Dependencies = { localeId: DatabaseDef_Locale };

export type DB_I18nOverlay = DB_Object<DBKey> & {
	key: string;
	localeId: DB_Locale['_id'];
	forms: I18N_Forms;
	translatorNote?: string;
};

export type DatabaseDef_I18nOverlay = DB_Prototype<DB_ProtoSeed<DB_I18nOverlay, DBKey, GeneratedKeys, Versions, UniqueKeys, Dependencies>>;
export type UI_I18nOverlay = DatabaseDef_I18nOverlay['uiType'];
