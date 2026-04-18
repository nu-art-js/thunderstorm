import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_Locale, DBDef_Locale} from '@nu-art/locale-shared';
import type {UI_Locale} from '@nu-art/locale-shared';
import {asSetupTaskKey, type PerformProjectSetup, type SetupTask} from '@nu-art/action-processor-backend';
import {ModuleBE_Permissions, ServiceAccountId_Bootstrap, SetupTaskKey_PermissionsGroups} from '@nu-art/permissions-backend';

export const SetupTaskKey_DefaultLocales = asSetupTaskKey('default-locales');

// Future: as more libraries need env setup (e.g. default tags, default alert configs),
// consider a shared "env seed" orchestration layer that collects seed definitions
// from all modules and runs them as a coordinated setup phase.
const defaultLocales: Partial<UI_Locale>[] = [
	{code: 'en_US', displayName: 'English — United States', enabled: true},
	{code: 'he_IL', displayName: 'Hebrew — Israel', enabled: true},
	{code: 'ar_SA', displayName: 'Arabic — Saudi Arabia', enabled: true},
	{code: 'ru_RU', displayName: 'Russian — Russia', enabled: false},
	{code: 'fr_FR', displayName: 'French — France', enabled: false},
];

export class ModuleBE_LocaleDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_Locale>
	implements PerformProjectSetup {

	constructor() {
		super(DBDef_Locale);
	}

	protected async preWriteProcessing(dbInstance: DatabaseDef_Locale['uiType'], _originalDbInstance: DatabaseDef_Locale['dbType']) {
		const parts = dbInstance.code.split('_');
		dbInstance._language = parts[0] ?? '';
		dbInstance._country = parts[1] ?? '';
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
		const missing = defaultLocales.filter(l => !existingCodes.has(l.code!));
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
