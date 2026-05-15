import {BadImplementationException, MUSTNeverHappenException} from '@nu-art/ts-common';
import type {ParsedIdpMetadata} from '@nu-art/saml-shared';
import {AllowedMetadataHosts} from '@nu-art/saml-shared';

export function stripPemHeaders(pem: string): string {
	return pem
		.replace(/-----BEGIN CERTIFICATE-----/g, '')
		.replace(/-----END CERTIFICATE-----/g, '')
		.replace(/\s+/g, '');
}

export function validateMetadataHost(url: string, allowedHosts: string[] = AllowedMetadataHosts as unknown as string[]): void {
	const parsed = new URL(url);
	const hostname = parsed.hostname.toLowerCase();

	const isAllowed = allowedHosts.some(pattern => {
		if (pattern.startsWith('*.')) {
			const suffix = pattern.slice(1);
			return hostname.endsWith(suffix) || hostname === pattern.slice(2);
		}

		return hostname === pattern;
	});

	if (!isAllowed)
		throw new BadImplementationException(`Metadata URL host '${hostname}' is not in the allowed list`);
}

export function parseSamlMetadataXml(xml: string): ParsedIdpMetadata {
	const entityIdMatch = xml.match(/entityID="([^"]+)"/);
	if (!entityIdMatch)
		throw new MUSTNeverHappenException('Metadata XML missing entityID attribute');

	const idpEntityId = entityIdMatch[1];

	const ssoLoginUrlMatch = xml.match(/<SingleSignOnService[^>]+Binding="urn:oasis:names:tc:SAML:2\.0:bindings:HTTP-Redirect"[^>]+Location="([^"]+)"/);
	const ssoLoginUrlAlt = xml.match(/<SingleSignOnService[^>]+Location="([^"]+)"[^>]+Binding="urn:oasis:names:tc:SAML:2\.0:bindings:HTTP-Redirect"/);
	const ssoLoginUrl = ssoLoginUrlMatch?.[1] ?? ssoLoginUrlAlt?.[1];
	if (!ssoLoginUrl)
		throw new MUSTNeverHappenException('Metadata XML missing SingleSignOnService with HTTP-Redirect binding');

	const ssoLogoutUrlMatch = xml.match(/<SingleLogoutService[^>]+Binding="urn:oasis:names:tc:SAML:2\.0:bindings:HTTP-Redirect"[^>]+Location="([^"]+)"/);
	const ssoLogoutUrlAlt = xml.match(/<SingleLogoutService[^>]+Location="([^"]+)"[^>]+Binding="urn:oasis:names:tc:SAML:2\.0:bindings:HTTP-Redirect"/);
	const ssoLogoutUrl = ssoLogoutUrlMatch?.[1] ?? ssoLogoutUrlAlt?.[1];

	const certMatches = [...xml.matchAll(/<X509Certificate>([^<]+)<\/X509Certificate>/g)];
	if (certMatches.length === 0)
		throw new MUSTNeverHappenException('Metadata XML contains no X509Certificate elements');

	const certificates = certMatches.map(m => stripPemHeaders(m[1]));

	return {
		idpEntityId,
		ssoLoginUrl,
		ssoLogoutUrl,
		certificates,
	};
}

export async function fetchIdpMetadata(url: string): Promise<ParsedIdpMetadata> {
	validateMetadataHost(url);

	const response = await fetch(url);
	if (!response.ok)
		throw new BadImplementationException(`Failed to fetch metadata from ${url}: ${response.status} ${response.statusText}`);

	const xml = await response.text();
	return parseSamlMetadataXml(xml);
}
