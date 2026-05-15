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
import {__stringify, BadImplementationException, ImplementationMissingException, LogLevel, Module, MUSTNeverHappenException} from '@nu-art/ts-common';
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
}

export function resolveAssertion(response: SamlIdpResponse, relayState: string | undefined): SamlAssertResponse {
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

	constructor() {
		super();
		this.setMinLevel(LogLevel.Debug);
	}

	protected init(): void {
		super.init();

		if (!this.config.spConfig)
			throw new ImplementationMissingException('Config must contain spConfig');
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

			const account = await ModuleBE_AccountDB.findOrCreateByEmail(email);
			const initialClaims = {accountId: account._id, deviceId: data.loginContext.deviceId, label: 'saml-login'};
			const dbSession = await ModuleBE_SessionDB._session.create({initialClaims});

			let redirectUrl = data.loginContext[QueryParam_RedirectUrl];

			redirectUrl = redirectUrl.replace(new RegExp(QueryParam_SessionId.toUpperCase(), 'g'), encodeURIComponent(dbSession.sessionIdJwt));
			redirectUrl = redirectUrl.replace(new RegExp(QueryParam_Email.toUpperCase(), 'g'), encodeURIComponent(email));

			MemKey_HttpResponse.get().redirect(302, redirectUrl);
		} catch (error: any) {
			throw HttpCodes._4XX.UNAUTHORIZED('Error authenticating user', error.message, error);
		}
	}

	@ApiHandler(ApiDef_SAML.loginSaml)
	async loginSaml(loginContext: API_SAML['loginSaml']['Params']) {
		const domain = extractDomain(loginContext.email);
		const provider = await this.resolveProvider(domain);
		const idp = createIdentityProvider(provider);

		return new Promise<API_SAML['loginSaml']['Response']>((resolve, rejected) => {
			const sp = new ServiceProvider(this.config.spConfig);
			const options = {
				relay_state: __stringify(loginContext)
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

		const assertBody: RequestBody_SamlAssertOptions = {request_body};
		const sp = new ServiceProvider(this.config.spConfig);

		const providers = await ModuleBE_SamlProviderDB.query.custom({where: {enabled: true}});
		if (providers.length === 0)
			throw HttpCodes._4XX.UNAUTHORIZED('No SAML providers configured');

		let lastError: any;
		for (const provider of providers) {
			const idp = createIdentityProvider(provider);
			try {
				return await new Promise<SamlAssertResponse>((resolve, reject) => {
					sp.post_assert(idp, assertBody, (error, response: SamlIdpResponse) => {
						if (error)
							return reject(error);

						try {
							resolve(resolveAssertion(response, assertBody.request_body.RelayState));
						} catch (e) {
							reject(e);
						}
					});
				});
			} catch (e) {
				lastError = e;
			}
		}

		throw lastError;
	};
}

export const ModuleBE_SAML = new ModuleBE_SAML_Class();
