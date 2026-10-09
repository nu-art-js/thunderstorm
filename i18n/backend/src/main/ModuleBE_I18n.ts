import {Module} from '@nu-art/ts-common';
import {asI18nKey, resolveI18n, type I18N_Brand, type I18N_Params} from '@nu-art/i18n-shared';
import {ModuleBE_LocaleDB} from './_entity/locale/ModuleBE_LocaleDB.js';
import {ModuleBE_I18nOverlayDB} from './_entity/overlay/ModuleBE_I18nOverlayDB.js';
import {ModuleBE_I18nDefaults} from './ModuleBE_I18nDefaults.js';

export const DefaultLocaleCode = 'en_US';

export class ModuleBE_I18n_Class
	extends Module {

	async resolve(id: I18N_Brand, params?: I18N_Params, localeCode: string = DefaultLocaleCode): Promise<string> {
		const [override, catalog] = await Promise.all([this.loadOverride(id, localeCode), ModuleBE_I18nDefaults.getCatalog(localeCode)]);
		return resolveI18n({id, params, localeCode, override, defaultText: catalog[asI18nKey(id)]});
	}

	// Two queries per call until overrides move to {locale, key} documents with a per-locale cache (design step 4).
	private async loadOverride(id: I18N_Brand, localeCode: string) {
		const locale = (await ModuleBE_LocaleDB.query.custom({where: {code: localeCode}}))[0];
		if (!locale)
			return undefined;

		const overlays = await ModuleBE_I18nOverlayDB.query.custom({where: {key: asI18nKey(id), localeId: locale._id}});
		return overlays[0]?.forms;
	}
}

export const ModuleBE_I18n = new ModuleBE_I18n_Class();
