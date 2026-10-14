import {expect} from 'chai';
import type {DB_Locale, I18N_LocaleCatalog} from '@nu-art/i18n-shared';
import {ModuleBE_I18nAPI_Class} from '../main/ModuleBE_I18nAPI.js';

/** Runs the real catalog() against a stub; a second module instance would register the route twice. */
class TestI18nAPI {
	records: Record<string, Partial<DB_Locale>> = {};
	reads: string[] = [];

	async findLocale(code: string) {
		return this.records[code] as DB_Locale | undefined;
	}

	async readCatalog(code: string): Promise<I18N_LocaleCatalog> {
		this.reads.push(code);
		return {'booking.title': `defaults:${code}`};
	}

	catalog(params: {locale: string}) {
		return ModuleBE_I18nAPI_Class.prototype.catalog.call(this as unknown as ModuleBE_I18nAPI_Class, params);
	}
}

const expectNotFound = async (action: () => Promise<unknown>) => {
	let error: unknown;
	try {
		await action();
	} catch (e) {
		error = e;
	}
	expect(error, 'expected a 404').to.exist;
	expect((error as {responseCode?: number}).responseCode).to.equal(404);
};

describe('ModuleBE_I18nAPI - catalog', () => {
	it('refuses a code that is not in I18nLocales', async () => {
		const api = new TestI18nAPI();
		await expectNotFound(() => api.catalog({locale: 'xx_XX'}));
		expect(api.reads).to.deep.equal([]);
	});

	it('refuses a locale whose record exists and is disabled', async () => {
		const api = new TestI18nAPI();
		api.records.fr_FR = {code: 'fr_FR', enabled: false};
		await expectNotFound(() => api.catalog({locale: 'fr_FR'}));
		expect(api.reads).to.deep.equal([]);
	});

	it('serves the RTDB defaults when there is no record', async () => {
		const api = new TestI18nAPI();
		expect(await api.catalog({locale: 'en_US'})).to.deep.equal({'booking.title': 'defaults:en_US'});
	});

	it('serves the RTDB defaults when the record is enabled', async () => {
		const api = new TestI18nAPI();
		api.records.he_IL = {code: 'he_IL', enabled: true};
		expect(await api.catalog({locale: 'he_IL'})).to.deep.equal({'booking.title': 'defaults:he_IL'});
	});
});
