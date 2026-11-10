import {expect} from 'chai';
import {ImplementationMissingException} from '@nu-art/ts-common';
import {resolveSetEnv} from '../../main/core/params.js';

describe('resolveSetEnv', () => {
	it('refuses an explicit local value', () => {
		expect(() => resolveSetEnv('local', false)).to.throw(ImplementationMissingException);
	});

	it('refuses local even when the flag is passed on a non-test run', () => {
		expect(() => resolveSetEnv('local', undefined)).to.throw(ImplementationMissingException);
	});

	it('keeps staging and prod', () => {
		expect(resolveSetEnv('staging', false)).to.equal('staging');
		expect(resolveSetEnv('prod', false)).to.equal('prod');
	});

	it('leaves an omitted value omitted outside a test run', () => {
		expect(resolveSetEnv(undefined, false)).to.equal(undefined);
	});

	it('uses the local project block when a test run omits the flag', () => {
		expect(resolveSetEnv(undefined, true)).to.equal('local');
	});
});
