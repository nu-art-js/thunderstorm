import {expect} from 'chai';
import {SetupTaskKey_PermissionsGroups} from '@nu-art/permissions-backend';
import {ModuleBE_LocaleDB, ModuleBE_LocaleDB_Class, SetupTaskKey_DefaultLocales, SetupTaskKey_LocaleAccess} from '../main/_entity/locale/ModuleBE_LocaleDB.js';
import {ModuleBE_I18n_Class} from '../main/ModuleBE_I18n.js';

class SpyLocaleDB_Class
	extends ModuleBE_LocaleDB_Class {
	calls: string[] = [];

	runAsI18n<R>(action: () => Promise<R>): Promise<R> {
		return action();
	}

	async ensureLocaleAccess(codes: string[] = []) {
		this.calls.push(`access:${codes.join(',')}`);
		return {created: 0, updated: 0};
	}

	protected async visibleLocaleCodes() {
		return [];
	}
}

describe('Locale access - project setup dispatch, not start', () => {
	it('exposes locale access as its own setup task, before the default locales', () => {
		const tasks = new SpyLocaleDB_Class().__performProjectSetup();
		const access = tasks.find(task => task.key === SetupTaskKey_LocaleAccess)!;
		const defaults = tasks.find(task => task.key === SetupTaskKey_DefaultLocales)!;
		expect(access.dependsOn).to.deep.equal([SetupTaskKey_PermissionsGroups]);
		expect(defaults.dependsOn).to.deep.equal([SetupTaskKey_LocaleAccess]);
	});

	it('the locale access task runs ensureLocaleAccess with the seed codes', async () => {
		const db = new SpyLocaleDB_Class();
		const access = db.__performProjectSetup().find(task => task.key === SetupTaskKey_LocaleAccess)!;
		await access.processor();
		expect(db.calls).to.deep.equal([`access:${db.config.seedLocales.map(locale => locale.code).join(',')}`]);
	});

	it('module init does not ensure locale access', () => {
		const original = ModuleBE_LocaleDB.ensureLocaleAccess;
		let called = false;
		ModuleBE_LocaleDB.ensureLocaleAccess = async () => {
			called = true;
			return {created: 0, updated: 0};
		};
		try {
			(new ModuleBE_I18n_Class() as unknown as { init: () => void }).init();
		} finally {
			ModuleBE_LocaleDB.ensureLocaleAccess = original;
		}
		expect(called).to.equal(false);
	});
});
