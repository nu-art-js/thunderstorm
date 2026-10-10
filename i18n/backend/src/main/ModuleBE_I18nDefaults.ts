import {ModuleBE_Firebase} from '@nu-art/firebase-backend';
import {catalogFromRtdb, I18nDefaults_RtdbPath, type I18N_LocaleCatalog, type I18N_Text} from '@nu-art/i18n-shared';
import {currentTimeMillis, Minute, Module} from '@nu-art/ts-common';

type Config = {
	/** RTDB path of the defaults tree (locale code → encoded key → text). */
	rtdbPath: string;
	/** Defaults are editable any time; a cached locale is re-read after this long. */
	cacheTtlMs: number;
};

type CacheEntry = { catalog: Promise<I18N_LocaleCatalog>; loadedAt: number };

/**
 * Reads the i18n defaults from the RTDB config, one locale at a time, and caches each locale.
 * The only source of default texts: code declares keys, never text.
 */
export class ModuleBE_I18nDefaults_Class
	extends Module<Config> {

	private readonly cache = new Map<string, CacheEntry>();

	constructor() {
		super();
		this.setDefaultConfig({rtdbPath: I18nDefaults_RtdbPath, cacheTtlMs: Minute});
	}

	/** The defaults catalog of a locale (empty when the locale has none). */
	getCatalog(localeCode: string): Promise<I18N_LocaleCatalog> {
		const cached = this.cache.get(localeCode);
		if (cached && currentTimeMillis() - cached.loadedAt < this.config.cacheTtlMs)
			return cached.catalog;

		const catalog = this.readLocale(localeCode).then(catalogFromRtdb);
		const entry = {catalog, loadedAt: currentTimeMillis()};
		this.cache.set(localeCode, entry);
		// A failed read must not stay cached.
		catalog.catch(() => this.cache.get(localeCode) === entry && this.cache.delete(localeCode));
		return catalog;
	}

	/** Drops a cached locale (or all) so the next read goes to the RTDB. */
	bust(localeCode?: string): void {
		if (localeCode === undefined)
			return this.cache.clear();

		this.cache.delete(localeCode);
	}

	protected async readLocale(localeCode: string): Promise<Record<string, I18N_Text> | undefined> {
		return ModuleBE_Firebase.createAdminSession().getDatabase().get<Record<string, I18N_Text> | undefined>(`${this.config.rtdbPath}/${localeCode}`, undefined);
	}
}

export const ModuleBE_I18nDefaults = new ModuleBE_I18nDefaults_Class();
