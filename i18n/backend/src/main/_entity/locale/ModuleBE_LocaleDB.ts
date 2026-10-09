import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_Locale, DBDef_Locale, localeIdFromCode, splitLocaleCode} from '@nu-art/i18n-shared';
import {HttpCodes} from '@nu-art/api-types';
import type {UI_Locale} from '@nu-art/i18n-shared';
import {asSetupTaskKey, type PerformProjectSetup, type SetupTask} from '@nu-art/action-processor-backend';
import {ModuleBE_Permissions, ServiceAccountId_Bootstrap, SetupTaskKey_PermissionsGroups} from '@nu-art/permissions-backend';

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

	__performProjectSetup(): SetupTask[] {
		return [{
			key: SetupTaskKey_DefaultLocales,
			dependsOn: [SetupTaskKey_PermissionsGroups],
			processor: () => ModuleBE_Permissions.runAsServiceAccount(ServiceAccountId_Bootstrap, () => this.ensureDefaultLocales()),
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
