import {ModuleBE_BaseDB, type PostWriteProcessingDataShape} from '@nu-art/db-api-backend';
import {DatabaseDef_Locale, DBDef_Locale, localeIdFromCode, planLocaleAccess, ServiceAccountConfig_I18n, ServiceAccountId_I18n, splitLocaleCode} from '@nu-art/i18n-shared';
import {HttpCodes} from '@nu-art/api-types';
import type {I18nLocaleCode, UI_Locale} from '@nu-art/i18n-shared';
import {DispatchKey_PermissionsGroups, ModuleBE_AccessGroupDB, ModuleBE_Permissions} from '@nu-art/permissions-backend';
import type {DB_AccessGroup, UI_AccessGroup} from '@nu-art/permissions-shared';
import type {CollectionActionType} from '@nu-art/firebase-backend/firestore/FirestoreCollection';
import {asArray, filterInstances, OnDispatch} from '@nu-art/ts-common';
import {DispatchKey_DefaultLocales, DispatchKey_LocaleAccess} from '../../project-setup.js';
import {graph_ProjectSetup} from '@nu-art/action-processor-backend';


/** Seeded once at project setup when missing. Override via the module config (`seedLocales`). */
export const DefaultSeedLocales: (Pick<UI_Locale, 'displayName' | 'enabled' | 'register'> & {code: I18nLocaleCode})[] = [
	{code: 'en_US', displayName: 'English — United States', enabled: true},
	{code: 'he_IL', displayName: 'Hebrew — Israel', enabled: true},
	{code: 'ar_SA', displayName: 'Arabic — Saudi Arabia', enabled: true},
	{code: 'ru_RU', displayName: 'Russian — Russia', enabled: false},
	{code: 'fr_FR', displayName: 'French — France', enabled: false},
];

type Config = {
	seedLocales: (Pick<UI_Locale, 'displayName' | 'enabled' | 'register'> & {code: I18nLocaleCode})[];
};

export class ModuleBE_LocaleDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_Locale, Config> {

	constructor() {
		super(DBDef_Locale);
		this.setDefaultConfig({seedLocales: DefaultSeedLocales});
		ModuleBE_Permissions.setDefaultConfig({
			serviceAccounts: {[ServiceAccountId_I18n]: ServiceAccountConfig_I18n},
		});
	}

	protected async preWriteProcessing(dbInstance: DatabaseDef_Locale['uiType'], originalDbInstance: DatabaseDef_Locale['dbType']) {
		if (originalDbInstance && originalDbInstance.code !== dbInstance.code)
			throw HttpCodes._4XX.BAD_REQUEST('Locale code cannot be changed', `Locale code is immutable ('${originalDbInstance.code}' -> '${dbInstance.code}'); create a new locale instead`);

		if (!dbInstance._id)
			dbInstance._id = localeIdFromCode(dbInstance.code);

		const {language, country} = splitLocaleCode(dbInstance.code);
		dbInstance._language = language;
		dbInstance._country = country;
	}

	/**
	 * A new locale gets its four groups at once, created by the i18n service account.
	 * Creating a group is not access-checked; members are seeded at creation.
	 */
	protected async postWriteProcessing(data: PostWriteProcessingDataShape<DatabaseDef_Locale['dbType']>, actionType: CollectionActionType) {
		await super.postWriteProcessing(data, actionType);
		const created = data.before ? [] : filterInstances(data.updated ? asArray(data.updated) : []);
		if (!created.length)
			return;

		await this.runAsI18n(() => this.ensureLocaleAccess(created.map(locale => locale.code))).catch((e: Error) =>
			this.logWarning(`Access groups for ${created.map(locale => locale.code).join(', ')} not ensured (re-run project setup)`, e));
	}

	runAsI18n<R>(action: () => Promise<R>): Promise<R> {
		return ModuleBE_Permissions.runAsServiceAccount(ServiceAccountId_I18n, action);
	}

	/** Enabled locale codes, read as the i18n service account through group membership. */
	enabledLocaleCodes(): Promise<string[]> {
		return this.runAsI18n(async () => (await this.query.custom({where: {enabled: true}})).map(locale => locale.code));
	}

	/**
	 * Idempotent: creates each locale's missing groups and unions missing required members/scopes into
	 * existing ones (never removes). Runs as the i18n service account. Locales are the given codes plus
	 * every locale that account can read.
	 */
	async ensureLocaleAccess(codes: string[] = []): Promise<{ created: number; updated: number }> {
		const visible = await this.visibleLocaleCodes();
		const all = [...new Set([...codes, ...visible])];
		const ids = all.flatMap(code => planLocaleAccess([code], []).create.map(group => group._id));
		const existing = filterInstances(await this.queryGroups(ids));
		const plan = planLocaleAccess(all, existing);
		if (plan.create.length)
			await this.createGroups(plan.create as UI_AccessGroup[]);

		for (const group of plan.update)
			await this.updateGroup(group).catch((e: Error) =>
				this.logWarning(`Group '${group._id}' is missing required members; only a Permissions Admin can update it`, e));

		if (plan.create.length || plan.update.length)
			this.logInfo(`Locale access: created ${plan.create.length} groups, repaired ${plan.update.length}`);

		return {created: plan.create.length, updated: plan.update.length};
	}

	protected async visibleLocaleCodes(): Promise<string[]> {
		return (await this.query.custom({where: {}})).map(locale => locale.code);
	}

	protected async createGroups(groups: UI_AccessGroup[]): Promise<void> {
		await ModuleBE_AccessGroupDB.create.all(groups);
	}

	protected async updateGroup(group: DB_AccessGroup): Promise<void> {
		await ModuleBE_AccessGroupDB.set.item(group);
	}

	protected async queryGroups(ids: string[]): Promise<(DB_AccessGroup | undefined)[]> {
		return ModuleBE_AccessGroupDB.query.all(ids as DB_AccessGroup['_id'][]);
	}

	/** Graph node DispatchKey_LocaleAccess: groups for the seed codes and every visible locale. */
	@OnDispatch(graph_ProjectSetup, {key: DispatchKey_LocaleAccess, runAfter: [DispatchKey_PermissionsGroups]})
	async ensureSeedLocaleAccess(): Promise<void> {
		await this.runAsI18n(() => this.ensureLocaleAccess(this.config.seedLocales.map(locale => locale.code)));
	}

	/** Graph node DispatchKey_DefaultLocales: seeds missing locales, read through the new memberships. */
	@OnDispatch(graph_ProjectSetup, {key: DispatchKey_DefaultLocales, runAfter: [DispatchKey_LocaleAccess]})
	seedDefaultLocales(): Promise<void> {
		return this.runAsI18n(() => this.ensureDefaultLocales());
	}

	private async ensureDefaultLocales(): Promise<void> {
		const existing = await this.query.custom({where: {}});
		this.logDebug(`Found ${existing.length} existing locales`);
		const existingCodes = new Set(existing.map(locale => locale.code));
		const missing = this.config.seedLocales.filter(locale => !existingCodes.has(locale.code!));
		if (missing.length === 0) {
			this.logDebug('All default locales already exist — skipping');
			return;
		}

		this.logDebug(`Seeding ${missing.length} missing locales:`);
		missing.forEach(locale => this.logDebug(`  ${locale.code} — ${locale.displayName} (enabled=${locale.enabled})`));
		await this.create.all(missing as UI_Locale[]);
		this.logInfo(`Seeded ${missing.length} default locales`);
	}
}

export const ModuleBE_LocaleDB = new ModuleBE_LocaleDB_Class();

