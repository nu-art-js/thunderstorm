import {Module} from '@nu-art/ts-common';
import {
	asI18nKey,
	createI18nTranslator,
	overlayPlainText,
	resolveI18n,
	resolveRequestLocale,
	type I18N_Brand,
	type I18N_LocaleCatalog,
	type I18N_Params,
	type I18nTranslator,
} from '@nu-art/i18n-shared';
import {ModuleBE_LocaleDB} from './_entity/locale/ModuleBE_LocaleDB.js';
import {ModuleBE_I18nOverlayDB} from './_entity/overlay/ModuleBE_I18nOverlayDB.js';
import {ModuleBE_I18nDefaults} from './ModuleBE_I18nDefaults.js';

export const DefaultLocaleCode = 'en_US';

/**
 * Backend strings. translator() reads the overlay with a normal permission-aware query (no per-locale
 * cache) and returns override text as a raw string. requestTranslator() accepts that string only when
 * it names an enabled locale.
 */
export class ModuleBE_I18n_Class
	extends Module {

	async translator(localeCode: string = DefaultLocaleCode): Promise<I18nTranslator> {
		const [overrides, defaults] = await Promise.all([
			this.loadOverrideStrings(localeCode),
			this.loadDefaults(localeCode),
		]);
		return createI18nTranslator(localeCode, {overrides, defaults});
	}

	/**
	 * Translator for a request: the explicit `lang` param when it names an enabled locale, else the
	 * fallback (the client's detected locale, or the app default). No cookies.
	 */
	async requestTranslator(explicit?: string | null, fallback: string = DefaultLocaleCode): Promise<I18nTranslator> {
		const enabled = await this.queryEnabledLocaleCodes();
		return this.translator(resolveRequestLocale(explicit, enabled, fallback));
	}

	async resolve(id: I18N_Brand, params?: I18N_Params, localeCode: string = DefaultLocaleCode): Promise<string> {
		const [override, catalog] = await Promise.all([this.loadOverride(id, localeCode), this.loadDefaults(localeCode)]);
		return resolveI18n({id, params, localeCode, override, defaultText: catalog[asI18nKey(id)]});
	}

	protected async queryEnabledLocaleCodes(): Promise<string[]> {
		return (await ModuleBE_LocaleDB.query.custom({where: {enabled: true}})).map(locale => locale.code);
	}

	protected async loadDefaults(localeCode: string): Promise<I18N_LocaleCatalog> {
		return ModuleBE_I18nDefaults.getCatalog(localeCode);
	}

	/** Overlay rows for one locale, as raw strings. One permission-aware query, not cached. */
	protected async loadOverrideStrings(localeCode: string): Promise<Record<string, string>> {
		const locale = (await ModuleBE_LocaleDB.query.custom({where: {code: localeCode}}))[0];
		if (!locale)
			return {};

		const rows = await ModuleBE_I18nOverlayDB.query.custom({where: {localeId: locale._id}});
		const overrides: Record<string, string> = {};
		for (const row of rows) {
			const text = overlayPlainText(row.forms);
			if (text !== undefined)
				overrides[row.key] = text;
		}

		return overrides;
	}

	// Forms for resolve(): the editor and plural path. Not cached.
	private async loadOverride(id: I18N_Brand, localeCode: string) {
		const locale = (await ModuleBE_LocaleDB.query.custom({where: {code: localeCode}}))[0];
		if (!locale)
			return undefined;

		const overlays = await ModuleBE_I18nOverlayDB.query.custom({where: {key: asI18nKey(id), localeId: locale._id}});
		return overlays[0]?.forms;
	}
}

export const ModuleBE_I18n = new ModuleBE_I18n_Class();
