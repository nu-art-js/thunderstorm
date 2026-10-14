import {expect} from 'chai';
import {graph_OnProjectSetup} from '@nu-art/action-processor-backend';
import {ModuleBE_LocaleDB} from '../main/_entity/locale/ModuleBE_LocaleDB.js';
import {ModuleBE_I18n_Class} from '../main/ModuleBE_I18n.js';

type Stubbable = {
	runAsI18n: <R>(action: () => Promise<R>) => Promise<R>;
	ensureLocaleAccess: (codes?: string[]) => Promise<{ created: number; updated: number }>;
	ensureDefaultLocales: () => Promise<void>;
};

/** Replaces the singleton's i18n service-account and DB steps with a call log for one test. */
const withStubs = async (test: (calls: string[]) => Promise<void>) => {
	const db = ModuleBE_LocaleDB as unknown as Stubbable;
	const original = {runAsI18n: db.runAsI18n, ensureLocaleAccess: db.ensureLocaleAccess, ensureDefaultLocales: db.ensureDefaultLocales};
	const calls: string[] = [];
	db.runAsI18n = action => action();
	db.ensureLocaleAccess = async (codes = []) => {
		calls.push(`access:${codes.join(',')}`);
		return {created: 0, updated: 0};
	};
	db.ensureDefaultLocales = async () => {
		calls.push('seed');
	};
	try {
		await test(calls);
	} finally {
		Object.assign(db, original);
	}
};

describe('Locale access - project setup graph, not start', () => {
	it('the setup graph ensures locale access, then seeds the default locales', () => withStubs(async calls => {
		await graph_OnProjectSetup.dispatch();
		const seedCodes = ModuleBE_LocaleDB.config.seedLocales.map(locale => locale.code).join(',');
		expect(calls).to.deep.equal([`access:${seedCodes}`, 'seed']);
	}));

	it('the locale module no longer registers a SetupTask', () => {
		expect((ModuleBE_LocaleDB as unknown as Record<string, unknown>).__performProjectSetup).to.equal(undefined);
	});

	it('module init does not ensure locale access', () => withStubs(async calls => {
		(new ModuleBE_I18n_Class() as unknown as { init: () => void }).init();
		expect(calls).to.deep.equal([]);
	}));
});
