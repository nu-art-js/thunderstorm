import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import type {I18N_Forms} from '../../register.js';

export const I18nOverlay_DbKey = 'i18n--overlays';
type DBKey = typeof I18nOverlay_DbKey;

type VersionTypes = { '1.0.0': DB_I18nOverlay };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes>;
type UniqueKeys = 'locale' | 'key';
type GeneratedKeys = never;
type Dependencies = {};

export type DB_I18nOverlay = DB_Object<DBKey> & {
	/** Locale code (`nl`, `en_US`). Together with `key` the document identity: one override per locale and key. */
	locale: string;
	key: string;
	forms: I18N_Forms;
	translatorNote?: string;
};

export type DatabaseDef_I18nOverlay = DB_Prototype<DB_ProtoSeed<DB_I18nOverlay, DBKey, GeneratedKeys, Versions, UniqueKeys, Dependencies>>;
export type UI_I18nOverlay = DatabaseDef_I18nOverlay['uiType'];
