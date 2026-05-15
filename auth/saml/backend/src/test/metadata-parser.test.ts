import {expect} from 'chai';
import {parseSamlMetadataXml, stripPemHeaders, validateMetadataHost} from '../main/metadata-parser.js';
import {extractDomain} from '../main/ModuleBE_SAML.js';

const sampleMetadataXml = `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor entityID="https://accounts.google.com/o/saml2?idpid=C01abc123" xmlns="urn:oasis:names:tc:SAML:2.0:metadata">
  <IDPSSODescriptor WantAuthnRequestsSigned="false" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <KeyDescriptor use="signing">
      <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
        <X509Data>
          <X509Certificate>MIIDdDCCAlygAwIBAgIGAXX1pWJzMA0GCSqGSIb3DQEBCwUA</X509Certificate>
        </X509Data>
      </KeyInfo>
    </KeyDescriptor>
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://accounts.google.com/o/saml2/idp?idpid=C01abc123"/>
    <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://accounts.google.com/o/saml2/logout?idpid=C01abc123"/>
  </IDPSSODescriptor>
</EntityDescriptor>`;

describe('stripPemHeaders', () => {
	it('strips BEGIN/END headers and whitespace', () => {
		const pem = '-----BEGIN CERTIFICATE-----\nMIIBcert\ndata==\n-----END CERTIFICATE-----';
		expect(stripPemHeaders(pem)).to.equal('MIIBcertdata==');
	});

	it('returns raw base64 unchanged', () => {
		const raw = 'MIIBcertdata==';
		expect(stripPemHeaders(raw)).to.equal('MIIBcertdata==');
	});

	it('handles Windows-style line endings', () => {
		const pem = '-----BEGIN CERTIFICATE-----\r\nMIIBcert\r\ndata==\r\n-----END CERTIFICATE-----';
		expect(stripPemHeaders(pem)).to.equal('MIIBcertdata==');
	});

	it('handles cert with embedded spaces', () => {
		const pem = 'MIIB cert data==';
		expect(stripPemHeaders(pem)).to.equal('MIIBcertdata==');
	});
});

describe('validateMetadataHost', () => {
	it('accepts accounts.google.com', () => {
		expect(() => validateMetadataHost('https://accounts.google.com/o/saml2?idpid=C01')).to.not.throw();
	});

	it('accepts login.microsoftonline.com', () => {
		expect(() => validateMetadataHost('https://login.microsoftonline.com/tenant/metadata')).to.not.throw();
	});

	it('accepts subdomain of okta.com via wildcard', () => {
		expect(() => validateMetadataHost('https://mycompany.okta.com/app/metadata')).to.not.throw();
	});

	it('accepts okta.com itself via wildcard', () => {
		expect(() => validateMetadataHost('https://okta.com/app/metadata')).to.not.throw();
	});

	it('rejects unknown hosts', () => {
		expect(() => validateMetadataHost('https://evil.com/metadata')).to.throw('not in the allowed list');
	});

	it('rejects localhost', () => {
		expect(() => validateMetadataHost('https://localhost/metadata')).to.throw('not in the allowed list');
	});

	it('accepts custom allowed hosts', () => {
		expect(() => validateMetadataHost('https://myidp.example.com/meta', ['myidp.example.com'])).to.not.throw();
	});

	it('rejects when custom list does not match', () => {
		expect(() => validateMetadataHost('https://other.com/meta', ['myidp.example.com'])).to.throw('not in the allowed list');
	});
});

describe('parseSamlMetadataXml', () => {
	it('extracts entityID', () => {
		const result = parseSamlMetadataXml(sampleMetadataXml);
		expect(result.idpEntityId).to.equal('https://accounts.google.com/o/saml2?idpid=C01abc123');
	});

	it('extracts SSO login URL', () => {
		const result = parseSamlMetadataXml(sampleMetadataXml);
		expect(result.ssoLoginUrl).to.equal('https://accounts.google.com/o/saml2/idp?idpid=C01abc123');
	});

	it('extracts SSO logout URL', () => {
		const result = parseSamlMetadataXml(sampleMetadataXml);
		expect(result.ssoLogoutUrl).to.equal('https://accounts.google.com/o/saml2/logout?idpid=C01abc123');
	});

	it('extracts certificates without PEM headers', () => {
		const result = parseSamlMetadataXml(sampleMetadataXml);
		expect(result.certificates).to.have.length(1);
		expect(result.certificates[0]).to.equal('MIIDdDCCAlygAwIBAgIGAXX1pWJzMA0GCSqGSIb3DQEBCwUA');
	});

	it('handles multiple certificates', () => {
		const xml = sampleMetadataXml.replace(
			'</X509Data>',
			'</X509Data></KeyDescriptor><KeyDescriptor use="signing"><KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><X509Data><X509Certificate>SecondCertBase64Data</X509Certificate></X509Data>'
		);
		const result = parseSamlMetadataXml(xml);
		expect(result.certificates).to.have.length(2);
		expect(result.certificates[1]).to.equal('SecondCertBase64Data');
	});

	it('throws on missing entityID', () => {
		const xml = sampleMetadataXml.replace('entityID="https://accounts.google.com/o/saml2?idpid=C01abc123"', '');
		expect(() => parseSamlMetadataXml(xml)).to.throw('entityID');
	});

	it('throws on missing SingleSignOnService', () => {
		const xml = sampleMetadataXml.replace(/<SingleSignOnService[^>]*\/>/g, '');
		expect(() => parseSamlMetadataXml(xml)).to.throw('SingleSignOnService');
	});

	it('throws on missing certificates', () => {
		const xml = sampleMetadataXml.replace(/<X509Certificate>[^<]*<\/X509Certificate>/g, '');
		expect(() => parseSamlMetadataXml(xml)).to.throw('X509Certificate');
	});

	it('handles attribute order variation in SingleSignOnService', () => {
		const xml = sampleMetadataXml.replace(
			'<SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://accounts.google.com/o/saml2/idp?idpid=C01abc123"/>',
			'<SingleSignOnService Location="https://example.com/sso" Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"/>'
		);
		const result = parseSamlMetadataXml(xml);
		expect(result.ssoLoginUrl).to.equal('https://example.com/sso');
	});

	it('returns undefined ssoLogoutUrl when not present', () => {
		const xml = sampleMetadataXml.replace(/<SingleLogoutService[^>]*\/>/g, '');
		const result = parseSamlMetadataXml(xml);
		expect(result.ssoLogoutUrl).to.be.undefined;
	});
});

describe('extractDomain', () => {
	it('extracts domain from a valid email', () => {
		expect(extractDomain('user@acme.com')).to.equal('acme.com');
	});

	it('lowercases the domain', () => {
		expect(extractDomain('User@ACME.COM')).to.equal('acme.com');
	});

	it('handles subdomains', () => {
		expect(extractDomain('user@mail.acme.co.uk')).to.equal('mail.acme.co.uk');
	});

	it('throws on email without @', () => {
		expect(() => extractDomain('nope')).to.throw('Invalid email format');
	});

	it('throws on email with multiple @', () => {
		expect(() => extractDomain('a@b@c.com')).to.throw('Invalid email format');
	});
});
