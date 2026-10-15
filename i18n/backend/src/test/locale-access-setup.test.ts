import {expect} from 'chai';
import {ModuleBE_LocaleDB_Class} from '../main/_entity/locale/ModuleBE_LocaleDB.js';
import {ModuleBE_I18n_Class} from '../main/ModuleBE_I18n.js';
import {graph_ProjectSetup} from '@nu-art/action-processor-backend';
import {DispatchKey_PermissionsGroups} from '@nu-art/permissions-backend';
import {DispatchKey_DefaultLocales} from '../main/project-setup.js';

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

describe('Locale access - project setup actions, not start', () => {
	beforeEach(() => graph_ProjectSetup.clear());
	afterEach(() => graph_ProjectSetup.clear());

	it('from the default-locales action: permission groups, then locale access, then seeding', async () => {
		const db = new SpyLocaleDB_Class();
		graph_ProjectSetup.register({key: DispatchKey_PermissionsGroups, run: async () => db.calls.push('groups')});
		(db as unknown as { ensureDefaultLocales: () => Promise<void> }).ensureDefaultLocales = async () => {
			db.calls.push('seed');
		};

		await graph_ProjectSetup.dispatchFrom([DispatchKey_DefaultLocales]);
		expect(db.calls).to.deep.equal(['groups', `access:${db.config.seedLocales.map(locale => locale.code).join(',')}`, 'seed']);
	});

	it('the locale module has no legacy setup task method', () => {
		expect((new SpyLocaleDB_Class() as unknown as Record<string, unknown>).__performProjectSetup).to.equal(undefined);
	});

	it('module init does not ensure locale access', async () => {
		const db = new SpyLocaleDB_Class();
		(new ModuleBE_I18n_Class() as unknown as { init: () => void }).init();
		expect(db.calls).to.deep.equal([]);
	});
});
