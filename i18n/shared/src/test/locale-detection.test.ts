import {expect} from 'chai';
import {detectLocale, matchSupportedLocale, normalizeLocaleTag, resolveRequestLocale} from '../main/locale-detection.js';

const supported = ['en', 'nl', 'de', 'he_IL'];

describe('locale detection', () => {
	it('normalizes browser tags', () => {
		expect(normalizeLocaleTag('nl-BE')).to.equal('nl_BE');
		expect(normalizeLocaleTag('EN')).to.equal('en');
		expect(normalizeLocaleTag('zh-Hant-TW')).to.equal('zh');
		expect(normalizeLocaleTag('*')).to.equal(undefined);
		expect(normalizeLocaleTag('')).to.equal(undefined);
	});

	it('matches exact, then language, then same-language locale', () => {
		expect(matchSupportedLocale('he-IL', supported)).to.equal('he_IL');
		expect(matchSupportedLocale('nl-BE', supported)).to.equal('nl');
		expect(matchSupportedLocale('he', supported)).to.equal('he_IL');
		expect(matchSupportedLocale('fr-FR', supported)).to.equal(undefined);
	});

	it('1. browser language wins, in preference order', () => {
		expect(detectLocale({supported, browserLanguages: ['fr-FR', 'de-AT', 'nl'], timeZone: 'Europe/Amsterdam', appDefault: 'en'})).to.equal('de');
	});

	it('2. then region, then time zone', () => {
		expect(detectLocale({supported, browserLanguages: ['fr-FR'], region: 'NL', appDefault: 'en'})).to.equal('nl');
		expect(detectLocale({supported, browserLanguages: ['fr-FR'], timeZone: 'Asia/Jerusalem', appDefault: 'en'})).to.equal('he_IL');
		expect(detectLocale({supported, timeZone: 'Europe/Vienna', appDefault: 'en'})).to.equal('de');
	});

	it('3. then the app default', () => {
		expect(detectLocale({supported, browserLanguages: ['fr-FR'], timeZone: 'Europe/Paris', appDefault: 'en'})).to.equal('en');
		expect(detectLocale({supported, appDefault: 'en'})).to.equal('en');
	});

	it('the explicit lang param wins when supported; otherwise the fallback', () => {
		expect(resolveRequestLocale('nl-NL', supported, 'en')).to.equal('nl');
		expect(resolveRequestLocale('fr', supported, 'de')).to.equal('de');
		expect(resolveRequestLocale(undefined, supported, 'en')).to.equal('en');
		expect(resolveRequestLocale('<script>', supported, 'en')).to.equal('en');
	});
});
