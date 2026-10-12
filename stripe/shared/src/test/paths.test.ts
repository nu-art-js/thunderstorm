import {expect} from 'chai';
import {appUrl} from '../main/paths.js';

describe('appUrl', () => {
	it('joins app-relative paths', () => {
		expect(appUrl('https://app.example.com', '/billing/done?x=1')).to.equal('https://app.example.com/billing/done?x=1');
	});

	it('refuses absolute, protocol-relative and backslash paths', () => {
		for (const path of ['https://evil.com', '//evil.com/x', '/\\evil.com', 'billing'])
			expect(() => appUrl('https://app.example.com', path), path).to.throw();
	});
});
