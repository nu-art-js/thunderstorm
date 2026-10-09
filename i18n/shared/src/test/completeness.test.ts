import {expect} from 'chai';
import {checkI18nCompleteness, formatI18nCompletenessReport} from '../main/completeness.js';
import type {I18N_Registration} from '../main/register.js';

const registrations = new Map<string, I18N_Registration>([
	['booking.title', {}],
	['inbox.unread', {params: {count: 'number'}}],
	['greeting', {params: {name: 'string'}}],
]);

const complete = {
	nl: {'booking:title': 'Boek', 'inbox:unread': {one: '{count} bericht', other: '{count} berichten'}, 'greeting': 'Hallo {name}'},
	en: {'booking:title': 'Book', 'inbox:unread': {one: '{count} message', other: '{count} messages'}, 'greeting': 'Hi {name}'},
};

describe('checkI18nCompleteness', () => {
	it('passes when every enabled locale has every key', () => {
		const report = checkI18nCompleteness({enabledLocales: ['nl', 'en'], defaults: complete, registrations});
		expect(report).to.deep.equal({ok: true, errors: [], warnings: []});
	});

	it('fails on a missing or empty default, per locale', () => {
		const defaults = {nl: {'booking:title': '', 'greeting': 'Hallo {name}'}, en: complete.en};
		const report = checkI18nCompleteness({enabledLocales: ['nl', 'en'], defaults, registrations});
		expect(report.ok).to.equal(false);
		expect(report.errors).to.deep.equal([
			{type: 'missing-default', locale: 'nl', key: 'booking.title'},
			{type: 'missing-default', locale: 'nl', key: 'inbox.unread'},
		]);
	});

	it('fails when an enabled locale has no defaults at all', () => {
		const report = checkI18nCompleteness({enabledLocales: ['de'], defaults: complete, registrations});
		expect(report.errors.map(e => e.key)).to.deep.equal(['booking.title', 'greeting', 'inbox.unread']);
	});

	it('ignores disabled locales', () => {
		expect(checkI18nCompleteness({enabledLocales: ['nl'], defaults: {...complete, de: {}}, registrations}).ok).to.equal(true);
	});

	it('fails on a placeholder the key does not declare (count and band are implicit)', () => {
		const defaults = {nl: {...complete.nl, 'booking:title': 'Boek bij {host}'}};
		const report = checkI18nCompleteness({enabledLocales: ['nl'], defaults, registrations});
		expect(report.errors).to.deep.equal([{type: 'unknown-param', locale: 'nl', key: 'booking.title', form: 'other', param: 'host'}]);
	});

	it('warns, without failing, on texts for unregistered keys', () => {
		const defaults = {nl: {...complete.nl, 'old:key': 'x'}};
		const report = checkI18nCompleteness({enabledLocales: ['nl'], defaults, registrations});
		expect(report.ok).to.equal(true);
		expect(report.warnings).to.deep.equal([{type: 'unregistered-key', locale: 'nl', key: 'old.key'}]);
	});

	it('formats a readable report', () => {
		const report = checkI18nCompleteness({enabledLocales: ['nl'], defaults: {nl: {'old:key': 'x'}}, registrations});
		const text = formatI18nCompletenessReport(report);
		expect(text).to.contain('3 error(s), 1 warning(s)');
		expect(text).to.contain('[nl] booking.title: no default');
		expect(text).to.contain('[nl] old.key: no code registers this key');
	});
});
