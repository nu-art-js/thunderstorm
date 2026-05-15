import {composeUrl, Module, TS_Object} from '@nu-art/ts-common';
import {ApiCallContext, ApiCaller} from '@nu-art/http-client';
import {API_SAML, ApiDef_SAML, ParsedIdpMetadata} from '@nu-art/saml-shared';
import {QueryParam_SessionId} from '@nu-art/user-account-shared';

class ModuleFE_SAML_Class
	extends Module {

	@ApiCaller(ApiDef_SAML.loginSaml, {onComplete: (m: ModuleFE_SAML_Class, ctx: ApiCallContext<API_SAML['loginSaml']>) => m.onLoginCompletedSAML(ctx)})
	async loginSaml(params: API_SAML['loginSaml']['Params']): Promise<API_SAML['loginSaml']['Response']> {
		void params;
		return undefined as unknown as API_SAML['loginSaml']['Response'];
	}

	@ApiCaller(ApiDef_SAML.assertSAML)
	async assertSAML(body: API_SAML['assertSAML']['Body']): Promise<API_SAML['assertSAML']['Response']> {
		void body;
		return undefined as unknown as API_SAML['assertSAML']['Response'];
	}

	@ApiCaller(ApiDef_SAML.previewMetadata)
	async previewMetadata(body: API_SAML['previewMetadata']['Body']): Promise<ParsedIdpMetadata> {
		void body;
		return undefined as unknown as ParsedIdpMetadata;
	}

	@ApiCaller(ApiDef_SAML.refreshMetadata)
	async refreshMetadata(body: API_SAML['refreshMetadata']['Body']): Promise<API_SAML['refreshMetadata']['Response']> {
		void body;
		return undefined as unknown as API_SAML['refreshMetadata']['Response'];
	}

	public composeSAMLUrl = () => {
		const params = new URLSearchParams(window.location.search);
		const paramsObj: TS_Object = {};
		for (const [key, value] of params) {
			paramsObj[key] = value;
		}

		return composeUrl(window.location.origin + window.location.pathname, {
			...paramsObj,
			[QueryParam_SessionId]: QueryParam_SessionId.toUpperCase(),
		});
	};

	private onLoginCompletedSAML = async (ctx: ApiCallContext<API_SAML['loginSaml']>) => {
		if (!ctx.response.loginUrl)
			return;

		window.location.href = ctx.response.loginUrl;
	};
}

export const ModuleFE_SAML = new ModuleFE_SAML_Class();
