import {expect} from 'chai';
import {catalogFromRtdb, decodeI18nRtdbKey, encodeI18nRtdbKey, textToForms} from '../main/catalog.js';

describe('i18n catalog (RTDB defaults)', () => {
	it('encodes keys into RTDB-safe keys and back', () => {
		expect(encodeI18nRtdbKey('booking.form.title')).to.equal('booking:form:title');
		expect(decodeI18nRtdbKey('booking:form:title')).to.equal('booking.form.title');
		expect(encodeI18nRtdbKey('who-am-i')).to.equal('who-am-i');
	});

	it('decodes a locale node into a catalog', () => {
		expect(catalogFromRtdb({'booking:title': 'Boek', 'inbox:unread': {one: '1', other: 'n'}})).to.deep.equal({'booking.title': 'Boek', 'inbox.unread': {one: '1', other: 'n'}});
	});

	it('an empty or missing node is an empty catalog', () => {
		expect(catalogFromRtdb(undefined)).to.deep.equal({});
		expect(catalogFromRtdb(null)).to.deep.equal({});
	});

	it('normalizes texts to forms', () => {
		expect(textToForms('x')).to.deep.equal({other: 'x'});
		expect(textToForms({one: 'a', other: 'b'})).to.deep.equal({one: 'a', other: 'b'});
		expect(textToForms(undefined)).to.equal(undefined);
	});
});
