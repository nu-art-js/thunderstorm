import {Module} from '@nu-art/ts-common';
import {createI18nTranslator, resolveRequestLocale, type I18N_Brand, type I18N_Params, type I18nTranslator} from '@nu-art/i18n-shared';
import {ModuleBE_I18nOverlayDB} from './_entity/overlay/ModuleBE_I18nOverlayDB.js';
import {ModuleBE_LocaleDB} from './_entity/locale/ModuleBE_LocaleDB.js';
import {ModuleBE_I18nDefaults} from './ModuleBE_I18nDefaults.js';

export const DefaultLocaleCode = 'en_US';

/**
 * Backend strings. Load a locale once with translator() and resolve synchronously (server-rendered
 * pages, meta, llms.txt, emails). Both sources are cached per locale: no query per string.
 */
export class ModuleBE_I18n_Class
	extends Module {

	async translator(localeCode: string = DefaultLocaleCode): Promise<I18nTranslator> {
		const [overrides, defaults] = await Promise.all([
			ModuleBE_I18nOverlayDB.getLocaleOverrides(localeCode),
			ModuleBE_I18nDefaults.getCatalog(localeCode),
		]);
		return createI18nTranslator(localeCode, {overrides, defaults});
	}

	/**
	 * Translator for a request: the explicit `lang` param when it names an enabled locale, else the
	 * fallback (the client's detected locale, or the app default). No cookies.
	 */
	async requestTranslator(explicit?: string | null, fallback: string = DefaultLocaleCode): Promise<I18nTranslator> {
		const enabled = (await ModuleBE_LocaleDB.query.custom({where: {enabled: true}})).map(locale => locale.code);
		return this.translator(resolveRequestLocale(explicit, enabled, fallback));
	}

	async resolve(id: I18N_Brand, params?: I18N_Params, localeCode: string = DefaultLocaleCode): Promise<string> {
		return (await this.translator(localeCode)).t(id, params);
	}
}

export const ModuleBE_I18n = new ModuleBE_I18n_Class();
