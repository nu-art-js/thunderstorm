import {HttpCodes} from '@nu-art/api-types';
import {ApiDef_I18n, type API_I18n} from '@nu-art/i18n-shared';
import {ApiHandler} from '@nu-art/http-server';
import {Module} from '@nu-art/ts-common';
import {ModuleBE_I18nDefaults} from './ModuleBE_I18nDefaults.js';
import {ModuleBE_LocaleDB} from './_entity/locale/ModuleBE_LocaleDB.js';
import {ModuleBE_I18nOverlayDB} from './_entity/overlay/ModuleBE_I18nOverlayDB.js';

/** Serves an enabled locale's texts (from the per-locale caches) to frontends. */
export class ModuleBE_I18nAPI_Class
	extends Module {

	@ApiHandler(ApiDef_I18n.catalog)
	async catalog(params: API_I18n['catalog']['Params']): Promise<API_I18n['catalog']['Response']> {
		const locales = await ModuleBE_LocaleDB.query.custom({where: {code: params.locale}});
		if (!locales[0]?.enabled)
			throw HttpCodes._4XX.NOT_FOUND('Unknown locale', `Locale '${params.locale}' does not exist or is disabled`);

		const [overrides, defaults] = await Promise.all([
			ModuleBE_I18nOverlayDB.getLocaleOverrides(params.locale),
			ModuleBE_I18nDefaults.getCatalog(params.locale),
		]);
		return {overrides, defaults};
	}
}

export const ModuleBE_I18nAPI = new ModuleBE_I18nAPI_Class();
