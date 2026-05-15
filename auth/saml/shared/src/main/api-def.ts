import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@nu-art/api-types';
import {QueryParam_RedirectUrl} from '@nu-art/user-account-shared';
import type {DB_SamlProvider} from './_entity/saml-provider/types.js';

export type ParsedIdpMetadata = {
	idpEntityId: string;
	ssoLoginUrl: string;
	ssoLogoutUrl?: string;
	certificates: string[];
};

export type API_SAML = {
	loginSaml: QueryApi<{ loginUrl: string }, { email: string, [QueryParam_RedirectUrl]: string, deviceId: string }>;
	assertSAML: BodyApi<void, { RelayState: string }>;
	previewMetadata: BodyApi<ParsedIdpMetadata, { metadataUrl: string }>;
	refreshMetadata: BodyApi<DB_SamlProvider, { _id: string }>;
}

export const ApiDef_SAML: ApiDefResolver<API_SAML> = {
	loginSaml: {method: HttpMethod.GET, path: '/v1/saml/login'},
	assertSAML: {method: HttpMethod.POST, path: '/v1/saml/assert'},
	previewMetadata: {method: HttpMethod.POST, path: '/v1/saml/provider/preview'},
	refreshMetadata: {method: HttpMethod.POST, path: '/v1/saml/provider/refresh'},
};
