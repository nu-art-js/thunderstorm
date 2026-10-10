import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_Locale, DBDef_Locale, i18nTranslatorGroupId, i18nTranslatorGroupKey, I18nTranslatorScopeEntryIds, localeIdFromCode, splitLocaleCode} from '@nu-art/i18n-shared';
import {HttpCodes} from '@nu-art/api-types';
import type {UI_Locale} from '@nu-art/i18n-shared';
import {asSetupTaskKey, type PerformProjectSetup, type SetupTask} from '@nu-art/action-processor-backend';
import {ModuleBE_AccessGroupDB, ModuleBE_Permissions, ServiceAccountId_Bootstrap, SetupTaskKey_PermissionsGroups} from '@nu-art/permissions-backend';
import type {UI_AccessGroup} from '@nu-art/permissions-shared';
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
	 * Every new locale gets its translator group (its ACL bucket), created under the caller's own
	 * permissions (needs access-group:create). If the caller lacks them, the project setup task
	 * creates the missing groups on its next run.
	 */
	protected async postWriteProcessing(data: PostWriteProcessingDataShape<DatabaseDef_Locale['dbType']>, actionType: CollectionActionType) {
		await super.postWriteProcessing(data, actionType);
		const created = data.before ? [] : filterInstances(data.updated ? asArray(data.updated) : []);
		for (const locale of created)
			await this.ensureTranslatorGroup(locale.code).catch((e: Error) =>
				this.logWarning(`Translator group for '${locale.code}' not created (run project setup as a permissions admin)`, e));
	}

	async ensureTranslatorGroup(locale: string): Promise<void> {
		const _id = i18nTranslatorGroupId(locale);
		if (await ModuleBE_AccessGroupDB.query.unique(_id))
			return;

		await ModuleBE_AccessGroupDB.create.item({
			_id,
			type: 'entity',
			key: i18nTranslatorGroupKey(locale),
			label: `Translator — ${locale}`,
			members: [],
			scopeEntries: I18nTranslatorScopeEntryIds,
		} as UI_AccessGroup);
		this.logInfo(`Created translator group for locale '${locale}'`);
	}

	private async ensureTranslatorGroups() {
		const locales = await this.query.custom({where: {}});
		for (const locale of locales)
			await this.ensureTranslatorGroup(locale.code);
	}

	__performProjectSetup(): SetupTask[] {
		return [{
			key: SetupTaskKey_DefaultLocales,
			dependsOn: [SetupTaskKey_PermissionsGroups],
			processor: () => ModuleBE_Permissions.runAsServiceAccount(ServiceAccountId_Bootstrap, async () => {
				await this.ensureDefaultLocales();
				await this.ensureTranslatorGroups();
			}),
		}];
	}

	private async ensureDefaultLocales() {
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
