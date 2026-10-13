import {HttpCodes} from '@nu-art/api-types';
import {ApiDef_I18n, isI18nLocaleCode, type API_I18n, type DB_Locale, type I18N_LocaleCatalog} from '@nu-art/i18n-shared';
import {ApiHandler} from '@nu-art/http-server';
import {Module} from '@nu-art/ts-common';
import {ModuleBE_I18nDefaults} from './ModuleBE_I18nDefaults.js';
import {ModuleBE_LocaleDB} from './_entity/locale/ModuleBE_LocaleDB.js';

/**
 * Serves the RTDB defaults catalog of a known locale to frontends.
 * The code must be in I18nLocales. A DB record is optional; only a record that exists and is disabled is refused.
 */
export class ModuleBE_I18nAPI_Class
	extends Module {

	@ApiHandler(ApiDef_I18n.catalog)
	async catalog(params: API_I18n['catalog']['Params']): Promise<API_I18n['catalog']['Response']> {
		if (!isI18nLocaleCode(params.locale))
			throw HttpCodes._4XX.NOT_FOUND('Unknown locale', `Locale '${params.locale}' is not in I18nLocales`);

		const locale = await this.findLocale(params.locale);
		if (locale && !locale.enabled)
			throw HttpCodes._4XX.NOT_FOUND('Unknown locale', `Locale '${params.locale}' is disabled`);

		return this.readCatalog(params.locale);
	}

	protected async findLocale(code: string): Promise<DB_Locale | undefined> {
		return (await ModuleBE_LocaleDB.query.custom({where: {code}}))[0];
	}

	protected readCatalog(code: string): Promise<I18N_LocaleCatalog> {
		return ModuleBE_I18nDefaults.getCatalog(code);
	}
}

export const ModuleBE_I18nAPI = new ModuleBE_I18nAPI_Class();
