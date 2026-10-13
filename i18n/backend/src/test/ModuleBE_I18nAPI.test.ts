import {expect} from 'chai';
import type {DB_Locale, I18N_LocaleCatalog} from '@nu-art/i18n-shared';
import {ModuleBE_I18nAPI_Class} from '../main/ModuleBE_I18nAPI.js';

class TestI18nAPI_Class
	extends ModuleBE_I18nAPI_Class {
	records: Record<string, Partial<DB_Locale>> = {};
	reads: string[] = [];

	protected async findLocale(code: string) {
		return this.records[code] as DB_Locale | undefined;
	}

	protected async readCatalog(code: string): Promise<I18N_LocaleCatalog> {
		this.reads.push(code);
		return {'booking.title': `defaults:${code}`};
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
		const api = new TestI18nAPI_Class();
		await expectNotFound(() => api.catalog({locale: 'xx_XX'}));
		expect(api.reads).to.deep.equal([]);
	});

	it('refuses a locale whose record exists and is disabled', async () => {
		const api = new TestI18nAPI_Class();
		api.records.fr_FR = {code: 'fr_FR', enabled: false};
		await expectNotFound(() => api.catalog({locale: 'fr_FR'}));
		expect(api.reads).to.deep.equal([]);
	});

	it('serves the RTDB defaults when there is no record', async () => {
		const api = new TestI18nAPI_Class();
		expect(await api.catalog({locale: 'en_US'})).to.deep.equal({'booking.title': 'defaults:en_US'});
	});

	it('serves the RTDB defaults when the record is enabled', async () => {
		const api = new TestI18nAPI_Class();
		api.records.he_IL = {code: 'he_IL', enabled: true};
		expect(await api.catalog({locale: 'he_IL'})).to.deep.equal({'booking.title': 'defaults:he_IL'});
	});
});
