import {ModuleBE_BaseDB, type PostWriteProcessingDataShape} from '@nu-art/db-api-backend';
import {canCreateInLocale, DatabaseDef_I18nOverlay, DBDef_I18nOverlay, PermissionScope_I18nOverlay, ServiceAccountId_I18n, type I18N_Forms} from '@nu-art/i18n-shared';
import type {CollectionActionType} from '@nu-art/firebase-backend';
import {asArray, currentTimeMillis, filterInstances, Minute} from '@nu-art/ts-common';
import {MemStorage, type MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';
import {MemKey_ServiceAccountId, MemKey_UserAccessIds, MemKey_UserScopePermissions, ModuleBE_Permissions, ModuleBE_PermissionsAssert} from '@nu-art/permissions-backend';
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
	 * A normal permission-aware query run as the i18n service account, which reads every locale through
	 * its membership of the locale's readers group. Every caller (anonymous, user, translator) gets the
	 * same view, so the per-locale cache is shared.
	 */
	protected async loadLocaleOverrides(locale: string): Promise<Record<string, I18N_Forms>> {
		const rows = await ModuleBE_Permissions.runAsServiceAccount(ServiceAccountId_I18n, () => this.query.custom({where: {locale}}));
		return Object.fromEntries(rows.map(row => [row.key, row.forms]));
	}

	protected async preWriteProcessing(dbInstance: DatabaseDef_I18nOverlay['uiType'], originalDbInstance: DatabaseDef_I18nOverlay['dbType']) {
		await super.preWriteProcessing(dbInstance, originalDbInstance);
		// Callers with a permission context need the overlay scope. Updates and deletes are checked by
		// document access (writers/deleters). Creation is not (the resolver stamps __access without
		// checking the creator), so membership of the locale's writers group is asserted here.
		if (peek(MemKey_UserScopePermissions))
			ModuleBE_PermissionsAssert.assertScopePermission(PermissionScope_I18nOverlay, 'create');

		const accessIds = peek(MemKey_UserAccessIds);
		if (!originalDbInstance && accessIds) {
			const callerIds = Object.values(accessIds).flat();
			if (!canCreateInLocale(callerIds, dbInstance.locale))
				throw HttpCodes._4XX.FORBIDDEN('No translator access to this locale', `Caller is not in the writers group of '${dbInstance.locale}'`);
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
