import {ModuleBE_BaseDB, type PostWriteProcessingDataShape} from '@nu-art/db-api-backend';
import {DatabaseDef_I18nOverlay, DBDef_I18nOverlay, type I18N_Forms} from '@nu-art/i18n-shared';
import type {CollectionActionType} from '@nu-art/firebase-backend';
import {asArray, currentTimeMillis, filterInstances, Minute} from '@nu-art/ts-common';

type Config = {
	/** Writes on this instance bust at once; this bounds staleness for writes made on other instances. */
	overridesCacheTtlMs: number;
};

type CacheEntry = { overrides: Promise<Record<string, I18N_Forms>>; loadedAt: number };

/**
 * Overrides: one document per (locale, key), _id composed from both, unique index on both.
 * Read per locale with one query and cached per locale; any write busts the written locales.
 */
export class ModuleBE_I18nOverlayDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_I18nOverlay, Config> {

	private readonly overridesCache = new Map<string, CacheEntry>();

	constructor() {
		super(DBDef_I18nOverlay);
		this.setDefaultConfig({overridesCacheTtlMs: Minute});
	}

	/** All overrides of a locale, by key. One query per locale per cache period. */
	getLocaleOverrides(locale: string): Promise<Record<string, I18N_Forms>> {
		const cached = this.overridesCache.get(locale);
		if (cached && currentTimeMillis() - cached.loadedAt < this.config.overridesCacheTtlMs)
			return cached.overrides;

		const overrides = this.loadLocaleOverrides(locale);
		const entry = {overrides, loadedAt: currentTimeMillis()};
		this.overridesCache.set(locale, entry);
		overrides.catch(() => this.overridesCache.get(locale) === entry && this.overridesCache.delete(locale));
		return overrides;
	}

	bustLocale(locale?: string): void {
		if (locale === undefined)
			return this.overridesCache.clear();

		this.overridesCache.delete(locale);
	}

	protected async loadLocaleOverrides(locale: string): Promise<Record<string, I18N_Forms>> {
		const rows = await this.query.custom({where: {locale}});
		return Object.fromEntries(rows.map(row => [row.key, row.forms]));
	}

	protected async postWriteProcessing(data: PostWriteProcessingDataShape<DatabaseDef_I18nOverlay['dbType']>, actionType: CollectionActionType) {
		await super.postWriteProcessing(data, actionType);
		const rows = filterInstances([data.before, data.updated, data.deleted].flatMap(items => items ? asArray(items) : []));
		new Set(rows.map(row => row.locale)).forEach(locale => this.bustLocale(locale));
	}
}

export const ModuleBE_I18nOverlayDB = new ModuleBE_I18nOverlayDB_Class();
