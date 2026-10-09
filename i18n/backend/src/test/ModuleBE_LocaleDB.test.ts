import {expect} from 'chai';
import {localeIdFromCode, type DB_Locale, type UI_Locale} from '@nu-art/i18n-shared';
import {DefaultSeedLocales, ModuleBE_LocaleDB_Class} from '../main/_entity/locale/ModuleBE_LocaleDB.js';

class TestLocaleDB_Class
	extends ModuleBE_LocaleDB_Class {
	prepare(instance: UI_Locale, original?: DB_Locale) {
		return this.preWriteProcessing(instance, original as DB_Locale);
	}
}

const locale = (overrides: Partial<UI_Locale> = {}) => ({code: 'nl_BE', displayName: 'Nederlands — België', enabled: true, ...overrides}) as UI_Locale;

describe('ModuleBE_LocaleDB - locale model', () => {
	const db = new TestLocaleDB_Class();

	it('derives _id, _language and _country from the code on create', async () => {
		const instance = locale();
		await db.prepare(instance);
		expect(instance._id).to.equal(localeIdFromCode('nl_BE'));
		expect(instance._language).to.equal('nl');
		expect(instance._country).to.equal('BE');
	});

	it('supports language-only codes', async () => {
		const instance = locale({code: 'nl'});
		await db.prepare(instance);
		expect(instance._language).to.equal('nl');
		expect(instance._country).to.equal('');
	});

	it('keeps an existing _id (documents created before ids were derived)', async () => {
		const instance = locale({_id: 'a'.repeat(32)} as Partial<UI_Locale>);
		await db.prepare(instance, {...instance, code: 'nl_BE'} as DB_Locale);
		expect(instance._id).to.equal('a'.repeat(32));
	});

	it('rejects changing the code of an existing locale', async () => {
		const instance = locale({code: 'nl'});
		let error: unknown;
		try {
			await db.prepare(instance, {...locale(), _id: localeIdFromCode('nl_BE')} as DB_Locale);
		} catch (e) {
			error = e;
		}
		expect(error).to.be.instanceOf(Error);
		expect(String((error as Error).message)).to.contain('immutable');
	});

	it('seeds from config, defaulting to the previous built-in list', () => {
		expect(DefaultSeedLocales.map(l => l.code)).to.deep.equal(['en_US', 'he_IL', 'ar_SA', 'ru_RU', 'fr_FR']);
	});
});
