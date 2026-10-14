import {expect} from 'chai';
import {ModuleBE_LocaleDB_Class} from '../main/_entity/locale/ModuleBE_LocaleDB.js';
import {ModuleBE_I18n_Class} from '../main/ModuleBE_I18n.js';
import {graph_I18nProjectSetup} from '../main/project-setup.js';

/** Records the service-account and DB steps instead of running them. Construction registers its @OnDispatch nodes. */
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
}

describe('Locale access - i18n project setup graph, not start', () => {
	beforeEach(() => graph_I18nProjectSetup.clear());
	afterEach(() => graph_I18nProjectSetup.clear());

	it('dispatching the graph ensures locale access, then seeds the default locales', async () => {
		const db = new SpyLocaleDB_Class();
		(db as unknown as { ensureDefaultLocales: () => Promise<void> }).ensureDefaultLocales = async () => {
			db.calls.push('seed');
		};

		await graph_I18nProjectSetup.dispatch();
		expect(db.calls).to.deep.equal([`access:${db.config.seedLocales.map(locale => locale.code).join(',')}`, 'seed']);
	});

	it('the locale module registers no SetupTask', () => {
		expect((new SpyLocaleDB_Class() as unknown as Record<string, unknown>).__performProjectSetup).to.equal(undefined);
	});

	it('module init does not ensure locale access', async () => {
		const db = new SpyLocaleDB_Class();
		(new ModuleBE_I18n_Class() as unknown as { init: () => void }).init();
		expect(db.calls).to.deep.equal([]);
	});
});
