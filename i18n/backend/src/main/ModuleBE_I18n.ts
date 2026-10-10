import {Module} from '@nu-art/ts-common';
import {createI18nTranslator, type I18N_Brand, type I18N_Params, type I18nTranslator} from '@nu-art/i18n-shared';
import {ModuleBE_I18nOverlayDB} from './_entity/overlay/ModuleBE_I18nOverlayDB.js';
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

	async resolve(id: I18N_Brand, params?: I18N_Params, localeCode: string = DefaultLocaleCode): Promise<string> {
		return (await this.translator(localeCode)).t(id, params);
	}
}

export const ModuleBE_I18n = new ModuleBE_I18n_Class();
