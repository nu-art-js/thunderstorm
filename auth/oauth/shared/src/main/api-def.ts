/*
 * @nu-art/oauth-shared - OAuth 2.1 shared types for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@nu-art/api-types';
import type {OAuthServerMetadata} from './token-claims.js';

export type API_OAuth = {
	getServerMetadata: QueryApi<OAuthServerMetadata>;
	authorize: QueryApi<void>;
	token: BodyApi<void, {
		grant_type: 'authorization_code' | 'refresh_token';
		code?: string;
		redirect_uri?: string;
		code_verifier?: string;
		client_id?: string;
		refresh_token?: string;
	}>;
	register: BodyApi<void, {
		client_name?: string;
		redirect_uris: string[];
		grant_types?: string[];
		response_types?: string[];
		token_endpoint_auth_method?: string;
		scope?: string;
	}>;
	revoke: BodyApi<void, {
		token: string;
		token_type_hint?: 'access_token' | 'refresh_token';
	}>;
	jwks: QueryApi<void>;
};

export const ApiDef_OAuth: ApiDefResolver<API_OAuth> = {
	getServerMetadata: {method: HttpMethod.GET, path: '/.well-known/oauth-authorization-server'},
	authorize: {method: HttpMethod.GET, path: '/oauth/authorize'},
	token: {method: HttpMethod.POST, path: '/oauth/token'},
	register: {method: HttpMethod.POST, path: '/oauth/register'},
	revoke: {method: HttpMethod.POST, path: '/oauth/revoke'},
	jwks: {method: HttpMethod.GET, path: '/oauth/jwks'},
};
