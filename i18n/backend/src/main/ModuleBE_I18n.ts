import {Module} from '@nu-art/ts-common';
import {asI18nKey, resolveI18n, type I18N_Brand, type I18N_Params} from '@nu-art/i18n-shared';
import {ModuleBE_LocaleDB} from './_entity/locale/ModuleBE_LocaleDB.js';
import {ModuleBE_I18nOverlayDB} from './_entity/overlay/ModuleBE_I18nOverlayDB.js';

export const DefaultLocaleCode = 'en_US';

export class ModuleBE_I18n_Class
	extends Module {

	async resolve(id: I18N_Brand, params?: I18N_Params, localeCode: string = DefaultLocaleCode): Promise<string> {
		const locales = await ModuleBE_LocaleDB.query.custom({where: {code: localeCode}});
		const locale = locales[0];
		const overlays = locale
			? await ModuleBE_I18nOverlayDB.query.custom({where: {key: asI18nKey(id), localeId: locale._id}})
			: [];
		return resolveI18n({
			id,
			params,
			localeCode,
			overlayForms: overlays[0]?.forms,
		});
	}
}

export const ModuleBE_I18n = new ModuleBE_I18n_Class();
