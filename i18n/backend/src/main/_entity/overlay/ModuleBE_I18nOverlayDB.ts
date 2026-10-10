import {ModuleBE_BaseDB, type PostWriteProcessingDataShape} from '@nu-art/db-api-backend';
import {DatabaseDef_I18nOverlay, DBDef_I18nOverlay, i18nOverrideWriterIds, PermissionScope_I18nOverlay, type I18N_Forms} from '@nu-art/i18n-shared';
import type {CollectionActionType} from '@nu-art/firebase-backend';
import {asArray, currentTimeMillis, filterInstances, Minute} from '@nu-art/ts-common';
import {MemStorage, type MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';
import {GroupId_AppDefault, MemKey_ServiceAccountId, MemKey_UserAccessIds, MemKey_UserScopePermissions, ModuleBE_PermissionsAssert} from '@nu-art/permissions-backend';
import {HttpCodes} from '@nu-art/api-types';
import {MemKey_AccountId} from '@nu-art/user-account-backend';

type Config = {
	/** Writes on this instance bust at once; this bounds staleness for writes made on other instances. */
	overridesCacheTtlMs: number;
};

/** MemKey.peak() throws outside a MemStorage context. */
const peek = <T>(key: MemKey<T>): T | undefined => MemStorage.getStore() ? key.peak() : undefined;

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
		if (!this.callerSeesSharedView())
			return overrides;

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

	/**
	 * A normal permission-aware query under the caller's context. Overrides are readable by the app
	 * Default group (every account), so any account (or an anonymous caller, which has no access
	 * context) sees the same set; only those results are shared through the cache.
	 */
	protected async loadLocaleOverrides(locale: string): Promise<Record<string, I18N_Forms>> {
		const rows = await this.query.custom({where: {locale}});
		return Object.fromEntries(rows.map(row => [row.key, row.forms]));
	}

	/** Whether the caller's reads are the shared view (no access context, or a Default-group member). */
	protected callerSeesSharedView(): boolean {
		const accessIds = peek(MemKey_UserAccessIds);
		return !accessIds || Object.values(accessIds).flat().includes(GroupId_AppDefault);
	}

	protected async preWriteProcessing(dbInstance: DatabaseDef_I18nOverlay['uiType'], originalDbInstance: DatabaseDef_I18nOverlay['dbType']) {
		await super.preWriteProcessing(dbInstance, originalDbInstance);
		// Callers with a permission context need the overlay scope. Updates and deletes are checked by
		// document access (writers/deleters). Creation is not (the resolver stamps __access without
		// checking the creator), so the locale bucket is asserted here.
		if (peek(MemKey_UserScopePermissions))
			ModuleBE_PermissionsAssert.assertScopePermission(PermissionScope_I18nOverlay, 'create');

		const accessIds = peek(MemKey_UserAccessIds);
		if (!originalDbInstance && accessIds) {
			const callerIds = Object.values(accessIds).flat();
			if (!i18nOverrideWriterIds(dbInstance.locale).some(id => callerIds.includes(id)))
				throw HttpCodes._4XX.FORBIDDEN('No translator access to this locale', `Caller is not in the translator group of '${dbInstance.locale}'`);
		}

		dbInstance._editedBy = peek(MemKey_AccountId) ?? peek(MemKey_ServiceAccountId) ?? 'system';
		dbInstance._editedAt = currentTimeMillis();
	}

	protected async postWriteProcessing(data: PostWriteProcessingDataShape<DatabaseDef_I18nOverlay['dbType']>, actionType: CollectionActionType) {
		await super.postWriteProcessing(data, actionType);
		const rows = filterInstances([data.before, data.updated, data.deleted].flatMap(items => items ? asArray(items) : []));
		new Set(rows.map(row => row.locale)).forEach(locale => this.bustLocale(locale));
	}
}

export const ModuleBE_I18nOverlayDB = new ModuleBE_I18nOverlayDB_Class();
