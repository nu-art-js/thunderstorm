import {expect} from 'chai';
import {tsValidateResult} from '@nu-art/ts-common';
import {i18nBrand} from '../main/brand.js';
import {i18nRegister} from '../main/register.js';
import {resolveI18n} from '../main/resolve.js';
import {DBDef_Locale} from '../main/_entity/locale/db-def.js';
import {DBDef_I18nOverlay} from '../main/_entity/overlay/db-def.js';

const i18n_INBOX_UNREAD = i18nBrand('inbox.unread');
i18nRegister(i18n_INBOX_UNREAD, {
	hint: 'Chat list badge. {count} is unread.',
	params: {count: 'number'},
	defaults: {
		en: {
			one: '{count} new message',
			other: '{count} new messages',
		},
	},
});

const i18n_WHO_AM_I = i18nBrand('who-am-i');
i18nRegister(i18n_WHO_AM_I, {
	defaults: {en: {other: 'Who am I'}},
});

describe('resolveI18n', () => {
	it('picks English other for count !== 1', () => {
		expect(resolveI18n({id: i18n_INBOX_UNREAD, localeCode: 'en_US', params: {count: 3}})).to.equal('3 new messages');
	});

	it('picks English one for count === 1', () => {
		expect(resolveI18n({id: i18n_INBOX_UNREAD, localeCode: 'en_US', params: {count: 1}})).to.equal('1 new message');
	});

	it('uses overlay form over defaults', () => {
		expect(resolveI18n({
			id: i18n_INBOX_UNREAD,
			localeCode: 'en_US',
			params: {count: 3},
			overlayForms: {other: '{count} unread'},
		})).to.equal('3 unread');
	});

	it('uses product band when provided', () => {
		expect(resolveI18n({
			id: i18n_INBOX_UNREAD,
			localeCode: 'en_US',
			params: {count: 12, band: 'flood'},
			overlayForms: {flood: '{count}+ in the queue', other: '{count} new messages'},
		})).to.equal('12+ in the queue');
	});

	it('falls back to the branded key when unregistered', () => {
		const orphan = i18nBrand('not.registered');
		expect(resolveI18n({id: orphan, localeCode: 'en_US'})).to.equal('not.registered');
	});

	it('resolves a static string', () => {
		expect(resolveI18n({id: i18n_WHO_AM_I, localeCode: 'he_IL'})).to.equal('Who am I');
	});
});

describe('validators', () => {
	it('accepts a locale', () => {
		expect(tsValidateResult({code: 'en_US', displayName: 'English - US', enabled: true}, DBDef_Locale.modifiablePropsValidator)).to.be.undefined;
	});

	it('accepts an overlay', () => {
		expect(tsValidateResult({
			key: 'inbox.unread',
			localeId: 'a'.repeat(32),
			forms: {other: '{count} new messages'},
		}, DBDef_I18nOverlay.modifiablePropsValidator)).to.be.undefined;
	});
});
