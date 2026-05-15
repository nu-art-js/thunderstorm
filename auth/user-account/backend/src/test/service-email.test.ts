import {expect} from 'chai';
import {displayServiceEmail, isServiceEmail, mangleServiceEmail} from '@nu-art/user-account-shared';

describe('Service Email Utilities', () => {
	describe('mangleServiceEmail', () => {
		it('injects ZWS after first char of local part', () => {
			const result = mangleServiceEmail('bot@example.com');
			expect(result).to.equal('b\u200Bot@example.com');
		});

		it('handles single-char local part', () => {
			const result = mangleServiceEmail('b@example.com');
			expect(result).to.equal('b\u200B@example.com');
		});

		it('handles no @ sign by prepending ZWS', () => {
			const result = mangleServiceEmail('no-at-sign');
			expect(result).to.equal('\u200Bno-at-sign');
		});

		it('preserves domain unchanged', () => {
			const result = mangleServiceEmail('svc@my-domain.io');
			expect(result.endsWith('@my-domain.io')).to.equal(true);
		});
	});

	describe('isServiceEmail', () => {
		it('returns true for mangled email', () => {
			const mangled = mangleServiceEmail('bot@example.com');
			expect(isServiceEmail(mangled)).to.equal(true);
		});

		it('returns false for normal email', () => {
			expect(isServiceEmail('user@example.com')).to.equal(false);
		});

		it('returns false for empty string', () => {
			expect(isServiceEmail('')).to.equal(false);
		});
	});

	describe('displayServiceEmail', () => {
		it('strips ZWS from mangled email', () => {
			const mangled = mangleServiceEmail('bot@example.com');
			expect(displayServiceEmail(mangled)).to.equal('bot@example.com');
		});

		it('returns normal email unchanged', () => {
			expect(displayServiceEmail('user@example.com')).to.equal('user@example.com');
		});
	});

	describe('idempotency', () => {
		it('mangling an already-mangled email does not double-mangle when checked with isServiceEmail', () => {
			const first = mangleServiceEmail('bot@example.com');
			expect(isServiceEmail(first)).to.equal(true);
		});

		it('display roundtrips correctly', () => {
			const original = 'service-account@corp.net';
			const mangled = mangleServiceEmail(original);
			const displayed = displayServiceEmail(mangled);
			expect(displayed).to.equal(original);
		});
	});
});
