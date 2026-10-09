import {expect} from 'chai';
import type {I18N_Text} from '@nu-art/i18n-shared';
import {ModuleBE_I18nDefaults_Class} from '../main/ModuleBE_I18nDefaults.js';

class TestI18nDefaults_Class
	extends ModuleBE_I18nDefaults_Class {
	tree: Record<string, Record<string, I18N_Text>> = {nl: {'booking:title': 'Boek een afspraak'}};
	reads: string[] = [];
	failNext = false;

	constructor(ttl = 60_000) {
		super();
		this.setDefaultConfig({cacheTtlMs: ttl});
	}

	protected async readLocale(localeCode: string) {
		this.reads.push(localeCode);
		if (this.failNext) {
			this.failNext = false;
			throw new Error('rtdb down');
		}

		return this.tree[localeCode];
	}
}

describe('ModuleBE_I18nDefaults', () => {
	it('reads a locale from the RTDB and decodes its keys', async () => {
		const defaults = new TestI18nDefaults_Class();
		expect(await defaults.getCatalog('nl')).to.deep.equal({'booking.title': 'Boek een afspraak'});
	});

	it('a locale without defaults is an empty catalog', async () => {
		expect(await new TestI18nDefaults_Class().getCatalog('de')).to.deep.equal({});
	});

	it('caches per locale and shares a pending read', async () => {
		const defaults = new TestI18nDefaults_Class();
		await Promise.all([defaults.getCatalog('nl'), defaults.getCatalog('nl')]);
		await defaults.getCatalog('nl');
		await defaults.getCatalog('de');
		expect(defaults.reads).to.deep.equal(['nl', 'de']);
	});

	it('bust(locale) re-reads that locale only; bust() re-reads all', async () => {
		const defaults = new TestI18nDefaults_Class();
		await defaults.getCatalog('nl');
		await defaults.getCatalog('de');
		defaults.tree.nl = {'booking:title': 'Plan een afspraak'};
		defaults.bust('nl');
		expect(await defaults.getCatalog('nl')).to.deep.equal({'booking.title': 'Plan een afspraak'});
		await defaults.getCatalog('de');
		defaults.bust();
		await defaults.getCatalog('de');
		expect(defaults.reads).to.deep.equal(['nl', 'de', 'nl', 'de']);
	});

	it('re-reads after the TTL (defaults are editable any time)', async () => {
		const defaults = new TestI18nDefaults_Class(0);
		await defaults.getCatalog('nl');
		await defaults.getCatalog('nl');
		expect(defaults.reads).to.deep.equal(['nl', 'nl']);
	});

	it('does not cache a failed read', async () => {
		const defaults = new TestI18nDefaults_Class();
		defaults.failNext = true;
		let failed = false;
		await defaults.getCatalog('nl').catch(() => failed = true);
		expect(failed).to.equal(true);
		expect(await defaults.getCatalog('nl')).to.deep.equal({'booking.title': 'Boek een afspraak'});
	});
});
