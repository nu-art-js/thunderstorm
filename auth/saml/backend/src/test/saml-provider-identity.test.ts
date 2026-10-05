import {expect} from 'chai';
import {assertSamlProviderIdentity} from '../main/_entity/saml-provider/saml-provider-identity.js';

describe('assertSamlProviderIdentity', () => {
	it('accepts an organization provider with no metadata URL', () => {
		expect(() => assertSamlProviderIdentity('org:af7fe965504e1bf6ae2b6175f0269195', '')).to.not.throw();
	});

	it('accepts an email domain with an allowed metadata host', () => {
		expect(() => assertSamlProviderIdentity('acme.com', 'https://accounts.google.com/o/saml2?idpid=C01')).to.not.throw();
	});

	it('rejects a domain that is neither an email domain nor an organization key', () => {
		expect(() => assertSamlProviderIdentity('not-a-domain', '')).to.throw('Invalid domain');
	});

	it('rejects a metadata URL on a host that is not allowed', () => {
		expect(() => assertSamlProviderIdentity('org:af7fe965504e1bf6ae2b6175f0269195', 'https://evil.example/metadata')).to.throw('not in the allowed list');
	});
});
