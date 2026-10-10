import {expect} from 'chai';
import {tsValidateResult} from '@nu-art/ts-common';
import {isLocaleCode, localeIdFromCode, splitLocaleCode} from '../main/_entity/locale/locale-code.js';
import {DBDef_Locale} from '../main/_entity/locale/db-def.js';

describe('locale code', () => {
	it('accepts language and language_REGION codes', () => {
		['en', 'nl', 'fil', 'en_US', 'he_IL'].forEach(code => expect(isLocaleCode(code), code).to.equal(true));
	});

	it('rejects other shapes', () => {
		['', 'EN', 'en-US', 'en_us', 'en_USA', 'e', 'english', 'ar_*'].forEach(code => expect(isLocaleCode(code), code).to.equal(false));
	});

	it('derives a stable id from the code', () => {
		expect(localeIdFromCode('nl')).to.equal(localeIdFromCode('nl'));
		expect(localeIdFromCode('nl')).to.not.equal(localeIdFromCode('nl_BE'));
		expect(localeIdFromCode('nl')).to.match(/^[0-9a-f]{32}$/);
	});

	it('splits language and country', () => {
		expect(splitLocaleCode('nl_BE')).to.deep.equal({language: 'nl', country: 'BE'});
		expect(splitLocaleCode('nl')).to.deep.equal({language: 'nl', country: ''});
	});
});

describe('locale validator', () => {
	const validate = (locale: object) => tsValidateResult(locale, DBDef_Locale.modifiablePropsValidator);

	it('accepts a register', () => {
		expect(validate({code: 'nl', displayName: 'Nederlands', enabled: true, register: 'formal'})).to.be.undefined;
		expect(validate({code: 'nl', displayName: 'Nederlands', enabled: true, register: 'informal'})).to.be.undefined;
	});

	it('rejects an unknown register', () => {
		expect(validate({code: 'nl', displayName: 'Nederlands', enabled: true, register: 'casual'})).to.not.be.undefined;
	});

	it('rejects a malformed code', () => {
		expect(validate({code: 'en-US', displayName: 'English', enabled: true})).to.not.be.undefined;
	});
});
