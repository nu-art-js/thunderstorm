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
import {__stringify, ImplementationMissingException, Module} from '@nu-art/ts-common';
import {
	ApiDef_SAML_BE,
	ApiStruct_SAML_BE,
	PostAssertBody,
	QueryParam_Email,
	QueryParam_RedirectUrl,
	QueryParam_SessionId,
	RequestBody_SamlAssertOptions,
	RequestParams_LoginSAML,
	Response_Auth,
	Response_LoginSAML
} from './_imports';
import {ApiDefServer, ApiException, ApiModule, ApiResponse, createQueryServerApi, ExpressRequest, ServerApi} from '@nu-art/thunderstorm/backend';
import {ModuleBE_Account} from './ModuleBE_Account';


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
	extends ServerApi<ApiStruct_SAML_BE['v1']['assertSAML']> {

	constructor() {
		super(ApiDef_SAML_BE.v1.assertSAML);
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: PostAssertBody) {
		const redirectUrl = await ModuleBE_SAML.assertSaml(body);
		return await response.redirect(302, redirectUrl);
	}
}

export class ModuleBE_SAML_Class
	extends Module<SamlConfig>
	implements ApiDefServer<ApiStruct_SAML_BE>, ApiModule {

	public identityProvider!: IdentityProvider;
	readonly v1: ApiDefServer<ApiStruct_SAML_BE>['v1'];

	constructor() {
		super();

		this.v1 = {
			loginSaml: createQueryServerApi(ApiDef_SAML_BE.v1.loginSaml, this.loginRequest),
			assertSAML: new AssertSamlToken(),
		};
	}

	useRoutes() {
		return [
			this.v1.loginSaml,
			this.v1.assertSAML,
		] as ServerApi<any>[];

	}

	protected init(): void {
		if (!this.config.idConfig)
			throw new ImplementationMissingException('Config must contain idConfig');

		if (!this.config.spConfig)
			throw new ImplementationMissingException('Config must contain spConfig');

		this.identityProvider = new IdentityProvider(this.config.idConfig);
	}

	async loginSAML(__email: string): Promise<Response_Auth> {
		const _email = __email.toLowerCase();
		const account = await this.createSAML(_email);

		return await ModuleBE_Account.upsertSession(account);
	}

	async assertSaml(request_body: PostAssertBody) {
		try {
			const data = await this.assert({request_body});
			this.logDebug(`Got data from assertion ${__stringify(data)}`);

			const userEmail = data.userId;
			const {sessionId: userToken} = await this.loginSAML(userEmail);

			let redirectUrl = data.loginContext[QueryParam_RedirectUrl];

			redirectUrl = redirectUrl.replace(new RegExp(QueryParam_SessionId.toUpperCase(), 'g'), userToken);
			redirectUrl = redirectUrl.replace(new RegExp(QueryParam_Email.toUpperCase(), 'g'), userEmail);

			return redirectUrl;
		} catch (error: any) {
			throw new ApiException(401, 'Error authenticating user', error);
		}
	}

	private async createSAML(__email: string) {
		const _email = __email.toLowerCase();
		return ModuleBE_Account.getOrCreate({where: {email: _email}});
	}

	loginRequest = async (loginContext: RequestParams_LoginSAML, request?: ExpressRequest) => {
		return new Promise<Response_LoginSAML>((resolve, rejected) => {
			const sp = new ServiceProvider(this.config.spConfig);
			const options = {
				relay_state: __stringify(loginContext)
			};
			sp.create_login_request_url(this.identityProvider, options, (error, loginUrl, requestId) => {
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
