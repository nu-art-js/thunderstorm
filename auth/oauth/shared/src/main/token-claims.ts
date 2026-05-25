/*
 * @nu-art/oauth-shared - OAuth 2.1 shared types for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

export type OAuthTokenClaims = {
	sub: string;
	iss: string;
	aud: string;
	exp: number;
	iat: number;
	scope: string;
	client_id: string;
	jti: string;
};

export type OAuthServerMetadata = {
	issuer: string;
	authorization_endpoint: string;
	token_endpoint: string;
	registration_endpoint: string;
	jwks_uri: string;
	revocation_endpoint: string;
	scopes_supported: string[];
	response_types_supported: string[];
	grant_types_supported: string[];
	code_challenge_methods_supported: string[];
	token_endpoint_auth_methods_supported: string[];
};

export type OAuthClientRegistrationRequest = {
	client_name?: string;
	redirect_uris: string[];
	grant_types?: string[];
	response_types?: string[];
	token_endpoint_auth_method?: 'none' | 'client_secret_post' | 'client_secret_basic';
	scope?: string;
};

export type OAuthClientRegistrationResponse = {
	client_id: string;
	client_secret?: string;
	client_name?: string;
	redirect_uris: string[];
	grant_types: string[];
	response_types: string[];
	token_endpoint_auth_method: string;
	scope?: string;
	client_id_issued_at: number;
};
