import {ModuleBE_I18n, ModuleBE_LocaleDB} from '@nu-art/i18n-backend';
import type {SeoTextsSource} from './texts-source.js';

/**
 * Texts from the i18n library. `ModuleBE_I18n.translator` reads overrides with a permission-aware query
 * and returns them as plain text. Enabled locales are the same kind of query, with no cache.
 */
export class I18nSeoTextsSource
	implements SeoTextsSource {

	enabledLocales(): Promise<string[]> {
		return ModuleBE_LocaleDB.query.custom({where: {enabled: true}}).then(rows => rows.map(row => row.code));
	}

	async translator(locale: string) {
		return (await ModuleBE_I18n.translator(locale)).t;
	}
}
