import {expect} from 'chai';
import {i18nBrand, type I18N_LocaleCatalog} from '@nu-art/i18n-shared';
import {ModuleBE_I18n_Class} from '../main/ModuleBE_I18n.js';

const title = i18nBrand('booking.title');

class TestI18n_Class
	extends ModuleBE_I18n_Class {

	enabled = ['en_US', 'nl'];
	loaded: string[] = [];

	protected async queryEnabledLocaleCodes() {
		return this.enabled;
	}

	protected async loadDefaults(localeCode: string): Promise<I18N_LocaleCatalog> {
		if (localeCode === 'en_US')
			return {[title]: 'Book {host}'};

		return {};
	}

	protected async loadOverrideStrings(localeCode: string) {
		this.loaded.push(localeCode);
		if (localeCode === 'nl')
			return {[title]: 'Boek <bij> {host}'};

		return {};
	}
}

describe('ModuleBE_I18n.requestTranslator', () => {
	it('keeps lang only when it matches an enabled locale, and renders the override as plain text', async () => {
		const i18n = new TestI18n_Class();
		const dutch = await i18n.requestTranslator('nl-NL', 'en_US');
		expect(dutch.localeCode).to.equal('nl');
		expect(dutch.t(title, {host: 'Ada'})).to.equal('Boek <bij> {host}');

		const fallback = await i18n.requestTranslator('fr', 'en_US');
		expect(fallback.localeCode).to.equal('en_US');
		expect(fallback.t(title, {host: 'Ada'})).to.equal('Book Ada');
		expect(i18n.loaded).to.deep.equal(['nl', 'en_US']);
	});
});
