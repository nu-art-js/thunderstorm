import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_Locale, DBDef_Locale, localeIdFromCode, planLocaleAccess, ServiceAccountId_I18n, splitLocaleCode} from '@nu-art/i18n-shared';
import {HttpCodes} from '@nu-art/api-types';
import type {UI_Locale} from '@nu-art/i18n-shared';
import {asSetupTaskKey, type PerformProjectSetup, type SetupTask} from '@nu-art/action-processor-backend';
import {ModuleBE_AccessGroupDB, ModuleBE_Permissions, SetupTaskKey_PermissionsGroups} from '@nu-art/permissions-backend';
import type {DB_AccessGroup, UI_AccessGroup} from '@nu-art/permissions-shared';
import type {PostWriteProcessingDataShape} from '@nu-art/db-api-backend';
import type {CollectionActionType} from '@nu-art/firebase-backend';
import {asArray, filterInstances} from '@nu-art/ts-common';

export const SetupTaskKey_DefaultLocales = asSetupTaskKey('default-locales');

/** Seeded once at project setup when missing. Override via the module config (`seedLocales`). */
export const DefaultSeedLocales: Pick<UI_Locale, 'code' | 'displayName' | 'enabled' | 'register'>[] = [
	{code: 'en_US', displayName: 'English — United States', enabled: true},
	{code: 'he_IL', displayName: 'Hebrew — Israel', enabled: true},
	{code: 'ar_SA', displayName: 'Arabic — Saudi Arabia', enabled: true},
	{code: 'ru_RU', displayName: 'Russian — Russia', enabled: false},
	{code: 'fr_FR', displayName: 'French — France', enabled: false},
];

type Config = {
	seedLocales: Pick<UI_Locale, 'code' | 'displayName' | 'enabled' | 'register'>[];
};

export class ModuleBE_LocaleDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_Locale, Config>
	implements PerformProjectSetup {

	constructor() {
		super(DBDef_Locale);
		this.setDefaultConfig({seedLocales: DefaultSeedLocales});
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
	 * A new locale (created in an admin's request) gets its four groups at once, created by the i18n
	 * service account. Creating a group is not access-checked; members are seeded at creation.
	 */
	protected async postWriteProcessing(data: PostWriteProcessingDataShape<DatabaseDef_Locale['dbType']>, actionType: CollectionActionType) {
		await super.postWriteProcessing(data, actionType);
		const created = data.before ? [] : filterInstances(data.updated ? asArray(data.updated) : []);
		if (created.length)
			await this.runAsI18n(() => this.ensureLocaleAccess(created.map(locale => locale.code))).catch((e: Error) =>
				this.logWarning(`Access groups for ${created.map(l => l.code).join(', ')} not ensured (re-run on next start)`, e));
	}

	runAsI18n<R>(action: () => Promise<R>): Promise<R> {
		return ModuleBE_Permissions.runAsServiceAccount(ServiceAccountId_I18n, action);
	}

	/** Enabled locale codes, read through the i18n service account's group membership (same view for every caller). */
	enabledLocaleCodes(): Promise<string[]> {
		return this.runAsI18n(async () => (await this.query.custom({where: {enabled: true}})).map(locale => locale.code));
	}

	/**
	 * Idempotent: creates each locale's missing groups and unions missing required members/scopes into
	 * existing ones (never removes). Must run inside a context (the i18n service account). Locales are
	 * the given codes plus every locale the caller can read.
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
				this.logWarning(`Group '${group.key}' is missing required members; only a Permissions Admin can update it`, e));

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

	__performProjectSetup(): SetupTask[] {
		return [{
			key: SetupTaskKey_DefaultLocales,
			dependsOn: [SetupTaskKey_PermissionsGroups],
			processor: () => this.ensureOnStart(),
		}];
	}

	/**
	 * Groups first (for the seed codes and every visible locale), then the seed locales in a fresh
	 * service-account context, which now reads existing locales through the new memberships.
	 */
	async ensureOnStart(): Promise<void> {
		const seedCodes = this.config.seedLocales.map(l => l.code!);
		await this.runAsI18n(() => this.ensureLocaleAccess(seedCodes));
		await this.runAsI18n(() => this.ensureDefaultLocales());
	}

	private async ensureDefaultLocales(): Promise<void> {
		const existing = await this.query.custom({where: {}});
		this.logDebug(`Found ${existing.length} existing locales`);
		const existingCodes = new Set(existing.map(l => l.code));
		const missing = this.config.seedLocales.filter(l => !existingCodes.has(l.code!));
		if (missing.length === 0) {
			this.logDebug('All default locales already exist — skipping');
			return;
		}

		this.logDebug(`Seeding ${missing.length} missing locales:`);
		missing.forEach(l => this.logDebug(`  ${l.code} — ${l.displayName} (enabled=${l.enabled})`));
		await this.create.all(missing as UI_Locale[]);
		this.logInfo(`Seeded ${missing.length} default locales`);
	}
}

export const ModuleBE_LocaleDB = new ModuleBE_LocaleDB_Class();
