/*
 * SAML 2.0 authentication module for Thunderstorm.
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {IdentityProvider, ServiceProvider, ServiceProviderOptions} from 'saml2-js';
import {__stringify, ApiException, BadImplementationException, ImplementationMissingException, isErrorOfType, LogLevel, Module, MUSTNeverHappenException} from '@nu-art/ts-common';
import {HttpCodes} from '@nu-art/api-types';
import {ApiHandler, MemKey_HttpResponse} from '@nu-art/http-server';
import {MemKey_AccountEmail, ModuleBE_AccountDB, ModuleBE_SessionDB} from '@nu-art/user-account-backend';
import {QueryParam_Email, QueryParam_RedirectUrl, QueryParam_SessionId} from '@nu-art/user-account-shared';
import {API_SAML, ApiDef_SAML, DB_SamlProvider, DatabaseDef_SamlProvider, PermissionScope_SamlProvider} from '@nu-art/saml-shared';
import {stringToUniqueId} from '@nu-art/db-api-shared';
import {RequirePermission} from '@nu-art/permissions-backend';
import {ModuleBE_SamlProviderDB} from './_entity/saml-provider/ModuleBE_SamlProviderDB.js';
import {fetchIdpMetadata} from './metadata-parser.js';

type SamlSpConfig = {
	spConfig: ServiceProviderOptions;
};

export type SamlIdpResponse = {
	'response_header': {
		'version': '2.0',
		'destination': string,
		'in_response_to': string,
		'id': string
	},
	'type': 'authn_response',
	'user': {
		'name_id': string,
		'session_index': string,
		'attributes': {}
	}
}

export type SamlAssertResponse = {
	fullResponse: SamlIdpResponse
	userId: string
	loginContext: API_SAML['loginSaml']['Params']
	providerDomain: string
}

export function resolveAssertion(response: SamlIdpResponse, relayState: string | undefined): Omit<SamlAssertResponse, 'providerDomain'> {
	if (!relayState)
		throw new MUSTNeverHappenException('LoginContext lost along the way');

	return {
		userId: response.user.name_id,
		loginContext: JSON.parse(relayState),
		fullResponse: response
	};
}

export function extractDomain(email: string): string {
	const parts = email.split('@');
	if (parts.length !== 2)
		throw HttpCodes._4XX.BAD_REQUEST(`Invalid email format: '${email}'`);

	return parts[1].toLowerCase();
}

/** Provider unique key carried through SAML RelayState — never guess among all enabled rows. */
export function samlProviderDomainFromRelayState(relayState: string): string {
	if (!relayState)
		throw HttpCodes._4XX.BAD_REQUEST('SAML relay state is missing');

	let ctx: {domain?: unknown; email?: unknown; organizationId?: unknown};
	try {
		ctx = JSON.parse(relayState);
	} catch {
		throw HttpCodes._4XX.BAD_REQUEST('SAML relay state is not JSON');
	}

	if (typeof ctx.domain === 'string' && ctx.domain.trim())
		return ctx.domain.toLowerCase().trim();
	if (typeof ctx.email === 'string' && ctx.email)
		return extractDomain(ctx.email);
	if (typeof ctx.organizationId === 'string' && ctx.organizationId)
		return `org:${ctx.organizationId}`;

	throw HttpCodes._4XX.BAD_REQUEST('SAML relay state has no provider domain');
}

/** Issuer on a still-unverified response. Signature check happens after the provider is loaded. */
export function issuerFromSamlResponse(samlResponse: string | undefined): string {
	if (!samlResponse)
		throw HttpCodes._4XX.BAD_REQUEST('SAML response is missing');

	const xml = Buffer.from(samlResponse, 'base64').toString('utf8');
	const match = xml.match(/<(?:[A-Za-z0-9]+:)?Issuer\b[^>]*>([^<]+)<\/(?:[A-Za-z0-9]+:)?Issuer>/);
	const issuer = match?.[1]?.trim();
	if (!issuer)
		throw HttpCodes._4XX.BAD_REQUEST('SAML response has no issuer');
	return issuer;
}

function createIdentityProvider(provider: DB_SamlProvider): IdentityProvider {
	const options: any = {
		sso_login_url: provider.ssoLoginUrl,
		certificates: provider.certificates,
		ignore_signature: false,
	};
	if (provider.ssoLogoutUrl)
		options.sso_logout_url = provider.ssoLogoutUrl;

	return new IdentityProvider(options);
}

export class ModuleBE_SAML_Class
	extends Module<SamlSpConfig> {

	private assertionHandoff?: (email: string, relayState: string | undefined, providerDomain: string) => Promise<string>;
	private signingCertificates?: (provider: DB_SamlProvider) => Promise<string[]>;

	constructor() {
		super();
		this.setMinLevel(LogLevel.Debug);
	}

	/** When set, a verified assertion redirects to the returned URL and does not create an account. */
	setAssertionHandoff(handoff: (email: string, relayState: string | undefined, providerDomain: string) => Promise<string>) {
		this.assertionHandoff = handoff;
	}

	/** Backend-only. The returned PEM list is for assertion verification and is not an API response. */
	setSigningCertificates(load: (provider: DB_SamlProvider) => Promise<string[]>) {
		this.signingCertificates = load;
	}

	private async identityProvider(provider: DB_SamlProvider): Promise<IdentityProvider> {
		if (!this.signingCertificates)
			return createIdentityProvider(provider);
		const certificates = await this.signingCertificates(provider);
		return createIdentityProvider({...provider, certificates});
	}

	protected init(): void {
		super.init();

		if (!this.config.spConfig)
			this.logWarningBold('SAML spConfig is empty. Set ModuleBE_SAML.spConfig in env config before SSO login.');
	}

	/** Login URL for one already-loaded provider. Relay state is returned on the assertion. */
	async createLoginUrl(provider: DB_SamlProvider, relayState: string): Promise<string> {
		if (!this.config.spConfig)
			throw new ImplementationMissingException('SAML spConfig is not configured');

		const idp = await this.identityProvider(provider);
		const sp = new ServiceProvider(this.config.spConfig);
		return new Promise<string>((resolve, rejected) => {
			sp.create_login_request_url(idp, {relay_state: relayState}, (error, loginUrl) => {
				if (error)
					return rejected(error);
				resolve(loginUrl);
			});
		});
	}

	/** Verifies the assertion and returns the email plus relay state. Does not create an account. */
	async readAssertion(body: API_SAML['assertSAML']['Body']): Promise<{email: string; relayState: string}> {
		const data = await this.assertImpl(body);
		return {email: data.userId.toLowerCase(), relayState: body.RelayState ?? ''};
	}

	private async providerForAssertion(body: API_SAML['assertSAML']['Body']): Promise<DB_SamlProvider> {
		if (this.isOurRelay(body.RelayState))
			return this.loadProvider(samlProviderDomainFromRelayState(body.RelayState));


		const issuer = issuerFromSamlResponse(body.SAMLResponse);
		const rows = await ModuleBE_SamlProviderDB.query.custom({where: {idpEntityId: issuer}});
		const enabled = rows.filter(row => row.enabled);
		const match = enabled[0] ?? rows[0];
		if (!match)
			throw HttpCodes._4XX.BAD_REQUEST('No SAML provider matches this Google sign-in');
		return match;
	}

	/** Signature verification still applies. Enabled is enforced by the handoff, so a test can run first. */
	private async loadProvider(domain: string): Promise<DB_SamlProvider> {
		const providers = await ModuleBE_SamlProviderDB.query.custom({where: {domain}, limit: 1});
		if (providers.length === 0)
			throw HttpCodes._4XX.UNAUTHORIZED(`No SAML provider configured for domain '${domain}'`);
		return providers[0];
	}

	private async resolveProvider(domain: string): Promise<DB_SamlProvider> {
		const providers = await ModuleBE_SamlProviderDB.query.custom({where: {domain, enabled: true}});
		if (providers.length === 0)
			throw HttpCodes._4XX.UNAUTHORIZED(`No SAML provider configured for domain '${domain}'`);

		return providers[0];
	}

	@ApiHandler(ApiDef_SAML.assertSAML)
	async assertSAML(body: API_SAML['assertSAML']['Body']): Promise<API_SAML['assertSAML']['Response']> {
		try {
			this.logDebug('assertion called with body:', body);
			const data = await this.assertImpl(body);
			this.logDebug(`Got data from assertion ${__stringify(data)}`);

			const email = data.userId.toLowerCase();
			MemKey_AccountEmail.set(email);

			if (this.assertionHandoff) {
				const url = await this.assertionHandoff(email, body.RelayState, data.providerDomain);
				MemKey_HttpResponse.get().redirect(302, url);
				return;
			}

			const account = await ModuleBE_AccountDB.findOrCreateByEmail(email);
			const initialClaims = {accountId: account._id, deviceId: data.loginContext.deviceId, label: 'saml-login'};
			const dbSession = await ModuleBE_SessionDB._session.create({initialClaims});

			let redirectUrl = data.loginContext[QueryParam_RedirectUrl];

			redirectUrl = redirectUrl.replace(new RegExp(QueryParam_SessionId.toUpperCase(), 'g'), encodeURIComponent(dbSession.sessionIdJwt));
			redirectUrl = redirectUrl.replace(new RegExp(QueryParam_Email.toUpperCase(), 'g'), encodeURIComponent(email));

			MemKey_HttpResponse.get().redirect(302, redirectUrl);
		} catch (error: unknown) {
			if (isErrorOfType(error, ApiException))
				throw error;
			const detail = error instanceof Error && error.message ? error.message : 'Error authenticating user';
			throw HttpCodes._4XX.UNAUTHORIZED(detail, detail, error instanceof Error ? error : undefined);
		}
	}

	@ApiHandler(ApiDef_SAML.loginSaml)
	async loginSaml(loginContext: API_SAML['loginSaml']['Params']) {
		const domain = extractDomain(loginContext.email);
		const provider = await this.resolveProvider(domain);
		const idp = await this.identityProvider(provider);

		return new Promise<API_SAML['loginSaml']['Response']>((resolve, rejected) => {
			const sp = new ServiceProvider(this.config.spConfig);
			const options = {
				relay_state: __stringify({
					...loginContext,
					domain: extractDomain(loginContext.email),
				})
			};

			sp.create_login_request_url(idp, options, (error, loginUrl, requestId) => {
				if (error)
					return rejected(error);

				resolve({loginUrl});
			});
		});
	}

	@RequirePermission(PermissionScope_SamlProvider, 'create')
	@ApiHandler(ApiDef_SAML.previewMetadata)
	async previewMetadata(body: API_SAML['previewMetadata']['Body']): Promise<API_SAML['previewMetadata']['Response']> {
		return fetchIdpMetadata(body.metadataUrl);
	}

	@RequirePermission(PermissionScope_SamlProvider, 'create')
	@ApiHandler(ApiDef_SAML.refreshMetadata)
	async refreshMetadata(body: API_SAML['refreshMetadata']['Body']): Promise<API_SAML['refreshMetadata']['Response']> {
		const id = stringToUniqueId<DatabaseDef_SamlProvider['dbKey']>(body._id);
		const existing = await ModuleBE_SamlProviderDB.query.unique(id);
		if (!existing)
			throw new BadImplementationException(`SAML provider not found: ${body._id}`);

		const metadata = await fetchIdpMetadata(existing.metadataUrl);

		return ModuleBE_SamlProviderDB.set.item({
			...existing,
			idpEntityId: metadata.idpEntityId,
			ssoLoginUrl: metadata.ssoLoginUrl,
			certificates: metadata.certificates,
			lastMetadataFetchAt: Date.now(),
			metadataFetchError: undefined,
		} as DB_SamlProvider);
	}

	private assertImpl = async (request_body: API_SAML['assertSAML']['Body']): Promise<SamlAssertResponse> => {
		type RequestBody_SamlAssertOptions = {
			request_body: API_SAML['assertSAML']['Body'],
			allow_unencrypted_assertion?: boolean;
		}

		if (!this.config.spConfig)
			throw new ImplementationMissingException('SAML spConfig is not configured');

		const spConfig = this.config.spConfig;
		const encryptionConfigured = Boolean(spConfig.private_key?.trim() && spConfig.certificate?.trim());
		const assertBody: RequestBody_SamlAssertOptions = {
			request_body,
			allow_unencrypted_assertion: !encryptionConfigured,
		};
		const provider = await this.providerForAssertion(request_body);
		const idp = await this.identityProvider(provider);
		const sp = new ServiceProvider(this.config.spConfig);

		return new Promise<SamlAssertResponse>((resolve, reject) => {
			sp.post_assert(idp, assertBody, (error, response: SamlIdpResponse) => {
				if (error)
					return reject(error);

				try {
					const parsed = this.isOurRelay(request_body.RelayState)
						? resolveAssertion(response, request_body.RelayState)
						: {
							fullResponse: response,
							userId: response.user.name_id,
							loginContext: {
								email: response.user.name_id,
								[QueryParam_RedirectUrl]: '',
								deviceId: '',
							},
						};
					resolve({...parsed, providerDomain: provider.domain});
				} catch (e) {
					reject(e);
				}
			});
		});
	}

	private isOurRelay(relayState: string | undefined): relayState is string {
		if (!relayState)
			return false;
		try {
			samlProviderDomainFromRelayState(relayState);
			return true;
		} catch {
			return false;
		}
	};
}

export const ModuleBE_SAML = new ModuleBE_SAML_Class();
