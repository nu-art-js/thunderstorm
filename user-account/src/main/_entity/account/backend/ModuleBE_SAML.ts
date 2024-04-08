/*
 * User secured registration and login management system..
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

import {IdentityProvider, IdentityProviderOptions, ServiceProvider, ServiceProviderOptions} from 'saml2-js';
import {__stringify, ApiException, decode, ImplementationMissingException, LogLevel, Module, MUSTNeverHappenException} from '@nu-art/ts-common';
import {addRoutes, createBodyServerApi, createQueryServerApi} from '@nu-art/thunderstorm/backend';
import {MemKey_HttpResponse} from '@nu-art/thunderstorm/backend/modules/server/consts';
import {ModuleBE_AccountDB} from './ModuleBE_AccountDB';
import {ApiDef_SAML, QueryParam_Email, QueryParam_RedirectUrl, QueryParam_SessionId, SAML_Assert, SAML_Login} from '../shared';
import {MemKey_AccountEmail} from '../../session/backend';


/**
 * SAML config, when filling in the RTDB, should look like this:
 * ```
 * ModuleBE_SAML: {
 *   idConfig: {
 *     sso_login_url: string - the accounts.google url for login
 *     sso_logout_url: string - the accounts.google url for login (optional)
 *     certificates: string[] - only one necessary, the cert for login
 *     ignore_signature: boolean - should be true
 *   },
 *   spConfig: {
 *   		allow_unencrypted_assertion: boolean - should be true
 *			assert_endpoint: string - the BE endpoint for the account assertion
 *			entity_id: string - the entityID from the google SAML project.
 *   }
 * }
 * ```
 */
type SamlConfig = {
	idConfig: IdentityProviderOptions,
	spConfig: ServiceProviderOptions
};

type _SamlAssertResponse = {
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

type SamlAssertResponse = {
	fullResponse: _SamlAssertResponse
	userId: string
	loginContext: SAML_Login['request']
}

export class ModuleBE_SAML_Class
	extends Module<SamlConfig> {

	public identityProvider!: IdentityProvider;

	constructor() {
		super();
		this.setMinLevel(LogLevel.Debug);
	}

	protected init(): void {
		super.init();

		if (!this.config.idConfig)
			throw new ImplementationMissingException('Config must contain idConfig');

		if (!this.config.spConfig)
			throw new ImplementationMissingException('Config must contain spConfig');

		addRoutes([
			createQueryServerApi(ApiDef_SAML._v1.loginSaml, this.loginRequest),
			createBodyServerApi(ApiDef_SAML._v1.assertSAML, this.assertSaml),
		]);

		this.config.idConfig.certificates = this.config.idConfig.certificates.map(cert => decode(cert));
		this.identityProvider = new IdentityProvider(this.config.idConfig);
	}

	assertSaml = async (body: SAML_Assert['request']): Promise<SAML_Assert['response']> => {
		try {
			const data = await this.assertImpl(body);
			this.logDebug(`Got data from assertion ${__stringify(data)}`);

			const accountWithoutPassword = {email: data.userId.toLowerCase(), deviceId: data.loginContext.deviceId, type: 'user'};
			MemKey_AccountEmail.set(accountWithoutPassword.email);

			const session = await ModuleBE_AccountDB.account.saml(accountWithoutPassword);

			let redirectUrl = data.loginContext[QueryParam_RedirectUrl];

			redirectUrl = redirectUrl.replace(new RegExp(QueryParam_SessionId.toUpperCase(), 'g'), encodeURIComponent(session.sessionId));
			redirectUrl = redirectUrl.replace(new RegExp(QueryParam_Email.toUpperCase(), 'g'), encodeURIComponent(accountWithoutPassword.email));

			MemKey_HttpResponse.get().redirect(302, redirectUrl);
		} catch (error: any) {
			throw new ApiException(401, 'Error authenticating user', error);
		}
	};

	loginRequest = async (loginContext: SAML_Login['request']) => {
		return new Promise<SAML_Login['response']>((resolve, rejected) => {
			const sp = new ServiceProvider(this.config.spConfig);
			const options = {
				relay_state: __stringify(loginContext)
			};

			sp.create_login_request_url(this.identityProvider, options, (error, loginUrl, requestId) => {
				console.log('SAML 2');
				if (error)
					return rejected(error);

				resolve({loginUrl});
			});
		});
	};

	private assertImpl = async (request_body: SAML_Assert['request']): Promise<SamlAssertResponse> => new Promise<SamlAssertResponse>((resolve, rejected) => {
		type RequestBody_SamlAssertOptions = {
			request_body: SAML_Assert['request'],
			allow_unencrypted_assertion?: boolean;
		}

		const assertBody: RequestBody_SamlAssertOptions = {request_body};
		const sp = new ServiceProvider(this.config.spConfig);
		sp.post_assert(this.identityProvider, assertBody, async (error, response: _SamlAssertResponse) => {
			if (error)
				return rejected(error);

			const relay_state = assertBody.request_body.RelayState;
			if (!relay_state)
				return rejected(new MUSTNeverHappenException('LoginContext lost along the way'));

			resolve({
				userId: response.user.name_id,
				loginContext: JSON.parse(relay_state),
				fullResponse: response
			});
		});
	});
}

export const ModuleBE_SAML = new ModuleBE_SAML_Class();