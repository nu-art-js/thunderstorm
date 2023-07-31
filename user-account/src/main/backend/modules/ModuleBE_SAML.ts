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
import {__stringify, ApiException, decode, ImplementationMissingException, LogLevel, Module} from '@nu-art/ts-common';
import {
	ApiDef_SAML_BE,
	ApiStruct_SAML_BE,
	QueryParam_Email,
	QueryParam_RedirectUrl,
	QueryParam_SessionId,
	RequestBody_SamlAssertOptions,
	RequestParams_LoginSAML,
	Response_Auth,
	Response_LoginSAML
} from './_imports';
import {addRoutes, createQueryServerApi, ServerApi} from '@nu-art/thunderstorm/backend';
import {MemKey_HttpRequestBody, MemKey_HttpResponse} from '@nu-art/thunderstorm/backend/modules/server/consts';
import {getUIAccount, ModuleBE_v2_AccountDB, ModuleBE_v2_SessionDB} from './v2';
import {MemKey_AccountEmail} from "../core/accounts-middleware";


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
	loginContext: RequestParams_LoginSAML
}

class AssertSamlToken
	extends ServerApi<ApiStruct_SAML_BE['vv1']['assertSAML']> {

	constructor() {
		super(ApiDef_SAML_BE.vv1.assertSAML);
	}

	protected async process() {
		const redirectUrl = await ModuleBE_SAML.assertSaml();
		return await MemKey_HttpResponse.get().redirect(302, redirectUrl);
	}
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
			createQueryServerApi(ApiDef_SAML_BE.vv1.loginSaml, this.loginRequest),
			new AssertSamlToken()
		]);

		this.config.idConfig.certificates = this.config.idConfig.certificates.map(cert => decode(cert));
		this.identityProvider = new IdentityProvider(this.config.idConfig);
	}

	async loginSAML(__email: string): Promise<Response_Auth> {
		const _email = __email.toLowerCase();
		const account = await this.createSAML(_email);

		return await ModuleBE_v2_SessionDB.upsertSession(getUIAccount(account));
	}

	async assertSaml() {
		const request_body = MemKey_HttpRequestBody.get();
		try {
			const data = await this.assert({request_body});
			this.logDebug(`Got data from assertion ${__stringify(data)}`);

			MemKey_AccountEmail.set(data.userId);

			const session = await this.loginSAML(data.userId);

			let redirectUrl = data.loginContext[QueryParam_RedirectUrl];

			redirectUrl = redirectUrl.replace(new RegExp(QueryParam_SessionId.toUpperCase(), 'g'), encodeURIComponent(session.sessionId));
			redirectUrl = redirectUrl.replace(new RegExp(QueryParam_Email.toUpperCase(), 'g'), encodeURIComponent(session.email));

			return redirectUrl;
		} catch (error: any) {
			throw new ApiException(401, 'Error authenticating user', error);
		}
	}

	private async createSAML(__email: string) {
		const _email = __email.toLowerCase();
		return ModuleBE_v2_AccountDB.getOrCreate({where: {email: _email}});
	}

	loginRequest = async (loginContext: RequestParams_LoginSAML) => {
		return new Promise<Response_LoginSAML>((resolve, rejected) => {
			console.log('SAML 1');
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

	assert = async (options: RequestBody_SamlAssertOptions,): Promise<SamlAssertResponse> => new Promise<SamlAssertResponse>((resolve, rejected) => {
		const sp = new ServiceProvider(this.config.spConfig);
		sp.post_assert(this.identityProvider, options, async (error, response: _SamlAssertResponse) => {
			if (error)
				return rejected(error);

			const relay_state = options.request_body.RelayState;
			if (!relay_state)
				return rejected('LoginContext lost along the way');

			resolve({
				userId: response.user.name_id,
				loginContext: JSON.parse(relay_state),
				fullResponse: response
			});
		});
	});
}

export const ModuleBE_SAML = new ModuleBE_SAML_Class();