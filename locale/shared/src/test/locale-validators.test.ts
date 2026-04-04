import {expect} from 'chai';
import {tsValidateResult} from '@nu-art/ts-common';
import {stringToUniqueId} from '@nu-art/db-api-shared';
import {DBDef_Locale} from '../main/_entity/locale/db-def.js';
import {DBDef_LocalizedString} from '../main/_entity/localized-string/db-def.js';
import type {DatabaseDef_Locale} from '../main/_entity/locale/types.js';
import type {DatabaseDef_LocalizedString} from '../main/_entity/localized-string/types.js';

const localeValidator = DBDef_Locale.modifiablePropsValidator;
const localizedStringValidator = DBDef_LocalizedString.modifiablePropsValidator;

const fakeLocaleId = stringToUniqueId<DatabaseDef_Locale['dbKey']>('a'.repeat(32));
const fakeLocalizedStringId = stringToUniqueId<DatabaseDef_LocalizedString['dbKey']>('b'.repeat(32));

describe('Locale modifiablePropsValidator', () => {
	it('Accepts valid Locale data', () => {
		const result = tsValidateResult({code: 'en_US', displayName: 'English - US', enabled: true}, localeValidator);
		expect(result).to.be.undefined;
	});

	it('Accepts disabled locale', () => {
		const result = tsValidateResult({code: 'he_IL', displayName: 'Hebrew - Israel', enabled: false}, localeValidator);
		expect(result).to.be.undefined;
	});

	it('Rejects missing code', () => {
		const result = tsValidateResult({displayName: 'English', enabled: true} as any, localeValidator);
		expect(result).to.not.be.undefined;
	});

	it('Rejects missing displayName', () => {
		const result = tsValidateResult({code: 'en_US', enabled: true} as any, localeValidator);
		expect(result).to.not.be.undefined;
	});

	it('Rejects missing enabled', () => {
		const result = tsValidateResult({code: 'en_US', displayName: 'English'} as any, localeValidator);
		expect(result).to.not.be.undefined;
	});

	it('Rejects undefined input', () => {
		const result = tsValidateResult(undefined, localeValidator);
		expect(result).to.not.be.undefined;
	});
});

describe('LocalizedString modifiablePropsValidator', () => {
	it('Accepts valid LocalizedString with originId', () => {
		const result = tsValidateResult({localeId: fakeLocaleId, originId: fakeLocalizedStringId, value: 'hello'}, localizedStringValidator);
		expect(result).to.be.undefined;
	});

	it('Accepts valid LocalizedString without originId (original term)', () => {
		const result = tsValidateResult({localeId: fakeLocaleId, value: 'hello'}, localizedStringValidator);
		expect(result).to.be.undefined;
	});

	it('Rejects missing localeId', () => {
		const result = tsValidateResult({value: 'hello'} as any, localizedStringValidator);
		expect(result).to.not.be.undefined;
	});

	it('Rejects missing value', () => {
		const result = tsValidateResult({localeId: fakeLocaleId} as any, localizedStringValidator);
		expect(result).to.not.be.undefined;
	});

	it('Rejects invalid localeId format (not 32 hex chars)', () => {
		const result = tsValidateResult({localeId: 'invalid-id' as any, value: 'hello'}, localizedStringValidator);
		expect(result).to.not.be.undefined;
	});

	it('Rejects invalid originId format', () => {
		const result = tsValidateResult({localeId: fakeLocaleId, originId: 'not-an-id' as any, value: 'hello'}, localizedStringValidator);
		expect(result).to.not.be.undefined;
	});

	it('Rejects undefined input', () => {
		const result = tsValidateResult(undefined, localizedStringValidator);
		expect(result).to.not.be.undefined;
	});
});
