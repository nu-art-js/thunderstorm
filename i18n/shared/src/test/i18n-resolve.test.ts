import {expect} from 'chai';
import {tsValidateResult} from '@nu-art/ts-common';
import {i18nBrand} from '../main/brand.js';
import {getI18nRegistration, i18nRegister} from '../main/register.js';
import {resolveI18n} from '../main/resolve.js';
import {DBDef_Locale} from '../main/_entity/locale/db-def.js';
import {DBDef_I18nOverlay} from '../main/_entity/overlay/db-def.js';
import {createI18nTranslator} from '../main/resolve.js';
import {i18nOverrideId} from '../main/_entity/overlay/db-def.js';

const i18n_INBOX_UNREAD = i18nRegister(i18nBrand('inbox.unread'), {
	context: 'Chat list badge. {count} is unread.',
	params: {count: 'number'},
});
const inboxDefault = {one: '{count} new message', other: '{count} new messages'};

const i18n_WHO_AM_I = i18nRegister(i18nBrand('who-am-i'));

describe('resolveI18n', () => {
	it('picks other for count !== 1', () => {
		expect(resolveI18n({id: i18n_INBOX_UNREAD, localeCode: 'en_US', params: {count: 3}, defaultText: inboxDefault})).to.equal('3 new messages');
	});

	it('picks one for count === 1', () => {
		expect(resolveI18n({id: i18n_INBOX_UNREAD, localeCode: 'en_US', params: {count: 1}, defaultText: inboxDefault})).to.equal('1 new message');
	});

	it('a plain string default is the other form', () => {
		expect(resolveI18n({id: i18n_WHO_AM_I, localeCode: 'nl', defaultText: 'Wie ben ik'})).to.equal('Wie ben ik');
	});

	it('override wins over the default', () => {
		expect(resolveI18n({
			id: i18n_INBOX_UNREAD,
			localeCode: 'en_US',
			params: {count: 3},
			override: {other: '{count} unread'},
			defaultText: inboxDefault,
		})).to.equal('3 unread');
	});

	it('falls back to the default when the override lacks the needed form', () => {
		expect(resolveI18n({id: i18n_INBOX_UNREAD, localeCode: 'en_US', params: {count: 1}, override: {}, defaultText: inboxDefault})).to.equal('1 new message');
	});

	it('uses a band when provided', () => {
		expect(resolveI18n({
			id: i18n_INBOX_UNREAD,
			localeCode: 'en_US',
			params: {count: 12, band: 'flood'},
			override: {flood: '{count}+ in the queue', other: '{count} new messages'},
		})).to.equal('12+ in the queue');
	});

	it('falls back to the key when there is no override or default', () => {
		expect(resolveI18n({id: i18nBrand('not.registered'), localeCode: 'en_US'})).to.equal('not.registered');
	});

	it('has no cross-locale fallback (texts come only from the given locale)', () => {
		expect(resolveI18n({id: i18n_WHO_AM_I, localeCode: 'he_IL'})).to.equal('who-am-i');
	});

	it('leaves unknown placeholders in place', () => {
		expect(resolveI18n({id: i18n_WHO_AM_I, localeCode: 'en', defaultText: 'Hi {name}'})).to.equal('Hi {name}');
	});
});

describe('i18nRegister', () => {
	it('rejects a duplicate key', () => {
		expect(() => i18nRegister(i18nBrand('who-am-i'))).to.throw('Duplicate');
	});

	it('keeps context and params, no text', () => {
		expect(getI18nRegistration(i18n_INBOX_UNREAD)).to.deep.equal({context: 'Chat list badge. {count} is unread.', params: {count: 'number'}});
	});
});

describe('validators', () => {
	it('accepts a locale', () => {
		expect(tsValidateResult({code: 'en_US', displayName: 'English - US', enabled: true}, DBDef_Locale.modifiablePropsValidator)).to.be.undefined;
	});

	it('accepts an overlay', () => {
		expect(tsValidateResult({
			key: 'inbox.unread',
			locale: 'en_US',
			forms: {other: '{count} new messages'},
		}, DBDef_I18nOverlay.modifiablePropsValidator)).to.be.undefined;
	});

	it('rejects an overlay with a malformed locale', () => {
		expect(tsValidateResult({locale: 'en-US', key: 'a', forms: {other: 'x'}}, DBDef_I18nOverlay.modifiablePropsValidator)).to.not.be.undefined;
	});

	it('overlay identity is (locale, key)', () => {
		expect(DBDef_I18nOverlay.uniqueKeys).to.deep.equal(['locale', 'key']);
		expect(i18nOverrideId('nl', 'a.b')).to.equal(i18nOverrideId('nl', 'a.b'));
		expect(i18nOverrideId('nl', 'a.b')).to.not.equal(i18nOverrideId('de', 'a.b'));
		expect(DBDef_I18nOverlay.indices?.find(i => i.id === 'locale-key')?.params?.unique).to.equal(true);
	});
});

describe('createI18nTranslator', () => {
	const t = createI18nTranslator('nl', {
		overrides: {'inbox.unread': {other: '{count} ongelezen'}},
		defaults: {'inbox.unread': {one: '{count} bericht', other: '{count} berichten'}, 'who-am-i': 'Wie ben ik'},
	}).t;

	it('resolves override > default > key, synchronously', () => {
		expect(t(i18n_INBOX_UNREAD, {count: 3})).to.equal('3 ongelezen');
		expect(t(i18n_INBOX_UNREAD, {count: 1})).to.equal('1 ongelezen');
		expect(t(i18n_WHO_AM_I)).to.equal('Wie ben ik');
		expect(t(i18nBrand('missing.key'))).to.equal('missing.key');
	});
});
