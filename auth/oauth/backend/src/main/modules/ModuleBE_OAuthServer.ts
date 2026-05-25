/*
 * @nu-art/oauth-backend - OAuth 2.1 Authorization Server for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Module} from '@nu-art/ts-common';
import {ApiHandler, MemKey_HttpRawResponse, MemKey_HttpRequest, MemKey_HttpResponse} from '@nu-art/http-server';
import * as jose from 'jose';
import {randomUUID, createHash} from 'node:crypto';
import type {OAuthServerMetadata, OAuthTokenClaims, OAuthClientRegistrationResponse} from '@nu-art/oauth-shared';
import {API_OAuth, ApiDef_OAuth} from '@nu-art/oauth-shared';
import type {DB_OAuthClient} from '@nu-art/oauth-shared';
import type {DB_OAuthGrant} from '@nu-art/oauth-shared';
import type {DB_OAuthToken} from '@nu-art/oauth-shared';

type Config = {
	issuer: string;
	baseUrl: string;
	accessTokenTtlMs: number;
	refreshTokenTtlMs: number;
	authorizationCodeTtlMs: number;
	signingAlgorithm: 'RS256' | 'ES256';
};

const DefaultConfig: Config = {
	issuer: '',
	baseUrl: '',
	accessTokenTtlMs: 3_600_000,
	refreshTokenTtlMs: 86_400_000 * 30,
	authorizationCodeTtlMs: 600_000,
	signingAlgorithm: 'RS256',
};

export type OAuthUserResolver = {
	resolveAccountId: (sessionJwt: string) => Promise<string>;
};

export class ModuleBE_OAuthServer_Class
	extends Module<Config> {

	private privateKey!: jose.KeyLike;
	private publicKey!: jose.KeyLike;
	private jwk!: jose.JWK;
	private kid!: string;

	private readonly clients = new Map<string, DB_OAuthClient>();
	private readonly grants = new Map<string, DB_OAuthGrant>();
	private readonly tokens = new Map<string, DB_OAuthToken>();
	private userResolver?: OAuthUserResolver;

	constructor() {
		super();
		this.setDefaultConfig(DefaultConfig);
	}

	setUserResolver(resolver: OAuthUserResolver): this {
		this.userResolver = resolver;
		return this;
	}

	protected init(): void {
		this.logInfo(`OAuth server initializing — issuer: '${this.config.issuer}', baseUrl: '${this.config.baseUrl}'`);
		this.logInfo(`OAuth server: userResolver=${!!this.userResolver}`);
		if (!this.config.issuer || !this.config.baseUrl)
			this.logWarningBold('OAuth server issuer and baseUrl must be configured. Using empty defaults.');

		this.generateKeyPair();
	}

	private generateKeyPair(): void {
		this.kid = randomUUID();

		const alg = this.config.signingAlgorithm;
		const keyPromise = alg === 'RS256'
			? jose.generateKeyPair('RS256', {extractable: true})
			: jose.generateKeyPair('ES256', {extractable: true});

		keyPromise.then(async ({publicKey, privateKey}) => {
			this.privateKey = privateKey;
			this.publicKey = publicKey;
			this.jwk = await jose.exportJWK(publicKey);
			this.jwk.kid = this.kid;
			this.jwk.alg = alg;
			this.jwk.use = 'sig';
			this.logInfo(`Key pair generated (alg: ${alg}, kid: ${this.kid})`);
		});
	}

	registerClient(client: DB_OAuthClient): void {
		this.clients.set(client.clientId, client);
		this.logInfo(`Registered OAuth client: ${client.name} (${client.clientId})`);
	}

	@ApiHandler(ApiDef_OAuth.getServerMetadata)
	async handleServerMetadata(_params: API_OAuth['getServerMetadata']['Params']): Promise<API_OAuth['getServerMetadata']['Response']> {
		const baseUrl = this.config.baseUrl;
		const metadata: OAuthServerMetadata = {
			issuer: this.config.issuer,
			authorization_endpoint: `${baseUrl}/oauth/authorize`,
			token_endpoint: `${baseUrl}/oauth/token`,
			registration_endpoint: `${baseUrl}/oauth/register`,
			jwks_uri: `${baseUrl}/oauth/jwks`,
			revocation_endpoint: `${baseUrl}/oauth/revoke`,
			scopes_supported: this.getAllSupportedScopes(),
			response_types_supported: ['code'],
			grant_types_supported: ['authorization_code', 'refresh_token'],
			code_challenge_methods_supported: ['S256'],
			token_endpoint_auth_methods_supported: ['none'],
		};
		this.logInfo(`/.well-known/oauth-authorization-server response:`);
		this.logInfo(`  issuer: ${metadata.issuer}`);
		this.logInfo(`  authorization_endpoint: ${metadata.authorization_endpoint}`);
		this.logInfo(`  token_endpoint: ${metadata.token_endpoint}`);
		this.logInfo(`  registration_endpoint: ${metadata.registration_endpoint}`);
		this.logInfo(`  scopes_supported: [${metadata.scopes_supported.join(', ')}]`);
		return metadata;
	}

	@ApiHandler(ApiDef_OAuth.authorize)
	async handleAuthorize(_params: API_OAuth['authorize']['Params']): Promise<void> {
		const req = MemKey_HttpRequest.get();
		const res = MemKey_HttpRawResponse.get();
		MemKey_HttpResponse.get().markConsumed();

		const clientId = req.query['client_id'] as string;
		const redirectUri = req.query['redirect_uri'] as string;
		const scope = req.query['scope'] as string;
		const state = req.query['state'] as string;
		const codeChallenge = req.query['code_challenge'] as string;
		const codeChallengeMethod = req.query['code_challenge_method'] as string;
		const responseType = req.query['response_type'] as string;

		this.logInfo(`/oauth/authorize request:`);
		this.logInfo(`  client_id: ${clientId}`);
		this.logInfo(`  redirect_uri: ${redirectUri}`);
		this.logInfo(`  scope: ${scope}`);
		this.logInfo(`  state: ${state}`);
		this.logInfo(`  code_challenge: ${codeChallenge}`);
		this.logInfo(`  code_challenge_method: ${codeChallengeMethod}`);
		this.logInfo(`  response_type: ${responseType}`);

		if (responseType !== 'code') {
			this.logWarning(`  REJECTED: unsupported_response_type '${responseType}'`);
			res.status(400).json({error: 'unsupported_response_type'});
			return;
		}

		const client = this.clients.get(clientId);
		if (!client || !client.enabled) {
			this.logWarning(`  REJECTED: invalid_client — clientId '${clientId}' not found (registered: [${[...this.clients.keys()].join(', ')}])`);
			res.status(400).json({error: 'invalid_client', error_description: 'Unknown or disabled client'});
			return;
		}

		if (!client.redirectUris.includes(redirectUri)) {
			this.logWarning(`  REJECTED: invalid redirect_uri '${redirectUri}' (allowed: [${client.redirectUris.join(', ')}])`);
			res.status(400).json({error: 'invalid_request', error_description: 'Invalid redirect_uri'});
			return;
		}

		if (codeChallengeMethod !== 'S256') {
			res.status(400).json({error: 'invalid_request', error_description: 'code_challenge_method must be S256'});
			return;
		}

		if (!codeChallenge) {
			res.status(400).json({error: 'invalid_request', error_description: 'code_challenge is required (PKCE)'});
			return;
		}

		const authorizationCode = randomUUID();
		const requestedScopes = scope?.split(' ') ?? [];

		const grant: DB_OAuthGrant = {
			_id: randomUUID(),
			__created: Date.now(),
			__updated: Date.now(),
			_v: OAuthGrant_DbKey,
			clientId,
			userId: 'pending-auth',
			scopes: requestedScopes,
			authorizationCode,
			codeChallenge,
			codeChallengeMethod: 'S256',
			redirectUri,
			expiresAt: Date.now() + this.config.authorizationCodeTtlMs,
			used: false,
		} as DB_OAuthGrant;

		this.grants.set(authorizationCode, grant);

		const redirectUrl = new URL(redirectUri);
		redirectUrl.searchParams.set('code', authorizationCode);
		if (state)
			redirectUrl.searchParams.set('state', state);

		this.logInfo(`  GRANTED: code=${authorizationCode.substring(0, 8)}... → redirect=${redirectUrl.origin}${redirectUrl.pathname}`);
		res.redirect(redirectUrl.toString());
	}

	@ApiHandler(ApiDef_OAuth.token)
	async handleToken(body: API_OAuth['token']['Body']): Promise<void> {
		const res = MemKey_HttpRawResponse.get();
		MemKey_HttpResponse.get().markConsumed();

		const {grant_type, code, redirect_uri, code_verifier, client_id, refresh_token} = body;

		this.logInfo(`/oauth/token request:`);
		this.logInfo(`  grant_type: ${grant_type}`);
		this.logInfo(`  client_id: ${client_id}`);
		this.logInfo(`  redirect_uri: ${redirect_uri}`);
		this.logInfo(`  code: ${code ? code.substring(0, 8) + '...' : 'undefined'}`);
		this.logInfo(`  code_verifier: ${code_verifier ? 'present' : 'undefined'}`);
		this.logInfo(`  refresh_token: ${refresh_token ? 'present' : 'undefined'}`);

		if (grant_type === 'authorization_code') {
			await this.handleAuthorizationCodeGrant(res, code!, redirect_uri!, code_verifier!, client_id!);
		} else if (grant_type === 'refresh_token') {
			await this.handleRefreshTokenGrant(res, refresh_token!, client_id!);
		} else {
			this.logWarning(`  REJECTED: unsupported_grant_type '${grant_type}'`);
			res.status(400).json({error: 'unsupported_grant_type'});
		}
	}

	@ApiHandler(ApiDef_OAuth.register)
	async handleRegister(body: API_OAuth['register']['Body']): Promise<void> {
		const res = MemKey_HttpRawResponse.get();
		MemKey_HttpResponse.get().markConsumed();

		this.logInfo(`/oauth/register request:`);
		this.logInfo(`  client_name: ${body.client_name ?? 'not provided'}`);
		this.logInfo(`  redirect_uris: [${body.redirect_uris?.join(', ') ?? ''}]`);
		this.logInfo(`  grant_types: [${body.grant_types?.join(', ') ?? ''}]`);
		this.logInfo(`  token_endpoint_auth_method: ${body.token_endpoint_auth_method ?? 'not provided'}`);
		this.logInfo(`  scope: ${body.scope ?? 'not provided'}`);

		if (!body.redirect_uris || body.redirect_uris.length === 0) {
			this.logWarning('  REJECTED: redirect_uris is required');
			res.status(400).json({error: 'invalid_client_metadata', error_description: 'redirect_uris is required'});
			return;
		}

		const clientId = randomUUID();
		const authMethod = body.token_endpoint_auth_method ?? 'none';
		const clientSecret = authMethod !== 'none' ? randomUUID() : undefined;
		const grantTypes = body.grant_types ?? ['authorization_code'];
		const responseTypes = body.response_types ?? ['code'];
		const allowedScopes = body.scope?.split(' ') ?? this.getAllSupportedScopes();

		const client: DB_OAuthClient = {
			_id: randomUUID(),
			__created: Date.now(),
			__updated: Date.now(),
			_v: 'oauth--clients',
			clientId,
			clientSecret: clientSecret ?? '',
			name: body.client_name ?? `dynamic-client-${clientId.substring(0, 8)}`,
			redirectUris: body.redirect_uris,
			allowedScopes,
			clientType: authMethod === 'none' ? 'public' : 'confidential',
			enabled: true,
		} as DB_OAuthClient;

		this.clients.set(clientId, client);
		this.logInfo(`  REGISTERED: clientId=${clientId}, name=${client.name}, type=${client.clientType}`);

		const response: OAuthClientRegistrationResponse = {
			client_id: clientId,
			...(clientSecret ? {client_secret: clientSecret} : {}),
			client_name: client.name,
			redirect_uris: client.redirectUris,
			grant_types: grantTypes,
			response_types: responseTypes,
			token_endpoint_auth_method: authMethod,
			scope: allowedScopes.join(' '),
			client_id_issued_at: Math.floor(Date.now() / 1000),
		};

		res.status(201).json(response);
	}

	@ApiHandler(ApiDef_OAuth.jwks)
	async handleJwks(_params: API_OAuth['jwks']['Params']): Promise<void> {
		const res = MemKey_HttpRawResponse.get();
		MemKey_HttpResponse.get().markConsumed();
		res.json({keys: [this.jwk]});
	}

	@ApiHandler(ApiDef_OAuth.revoke)
	async handleRevoke(body: API_OAuth['revoke']['Body']): Promise<void> {
		const res = MemKey_HttpRawResponse.get();
		MemKey_HttpResponse.get().markConsumed();

		if (!body.token) {
			res.status(400).json({error: 'invalid_request', error_description: 'token is required'});
			return;
		}

		const tokenHash = createHash('sha256').update(body.token).digest('hex');
		const tokenRecord = this.tokens.get(tokenHash);
		if (tokenRecord) {
			tokenRecord.revoked = true;
			this.logInfo(`Token revoked for client ${tokenRecord.clientId}`);
		}

		res.status(200).send();
	}

	private async handleAuthorizationCodeGrant(
		res: any,
		code: string,
		redirectUri: string,
		codeVerifier: string,
		clientId: string,
	): Promise<void> {
		const grant = this.grants.get(code);
		if (!grant || grant.used || grant.expiresAt < Date.now()) {
			res.status(400).json({error: 'invalid_grant', error_description: 'Invalid, used, or expired authorization code'});
			return;
		}

		if (grant.clientId !== clientId) {
			res.status(400).json({error: 'invalid_grant', error_description: 'Client ID mismatch'});
			return;
		}

		if (grant.redirectUri !== redirectUri) {
			res.status(400).json({error: 'invalid_grant', error_description: 'Redirect URI mismatch'});
			return;
		}

		const expectedChallenge = createHash('sha256')
			.update(codeVerifier)
			.digest('base64url');

		if (expectedChallenge !== grant.codeChallenge) {
			res.status(400).json({error: 'invalid_grant', error_description: 'PKCE code_verifier validation failed'});
			return;
		}

		grant.used = true;

		const accessToken = await this.issueAccessToken(grant.userId, grant.clientId, grant.scopes);
		const refreshTokenValue = await this.issueRefreshToken(grant.userId, grant.clientId, grant.scopes);

		this.logInfo(`  TOKEN ISSUED: clientId=${clientId}, scopes=[${grant.scopes.join(', ')}]`);
		res.json({
			access_token: accessToken,
			token_type: 'Bearer',
			expires_in: Math.floor(this.config.accessTokenTtlMs / 1000),
			scope: grant.scopes.join(' '),
			refresh_token: refreshTokenValue,
		});
	}

	private async handleRefreshTokenGrant(
		res: any,
		refreshToken: string,
		clientId: string,
	): Promise<void> {
		const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
		const tokenRecord = this.tokens.get(tokenHash);

		if (!tokenRecord || tokenRecord.revoked || tokenRecord.expiresAt < Date.now()) {
			res.status(400).json({error: 'invalid_grant', error_description: 'Invalid or expired refresh token'});
			return;
		}

		if (tokenRecord.clientId !== clientId) {
			res.status(400).json({error: 'invalid_grant', error_description: 'Client ID mismatch'});
			return;
		}

		tokenRecord.revoked = true;

		const accessToken = await this.issueAccessToken(tokenRecord.userId, tokenRecord.clientId, tokenRecord.scopes);
		const newRefreshToken = await this.issueRefreshToken(tokenRecord.userId, tokenRecord.clientId, tokenRecord.scopes);

		res.json({
			access_token: accessToken,
			token_type: 'Bearer',
			expires_in: Math.floor(this.config.accessTokenTtlMs / 1000),
			scope: tokenRecord.scopes.join(' '),
			refresh_token: newRefreshToken,
		});
	}

	private async issueAccessToken(userId: string, clientId: string, scopes: string[]): Promise<string> {
		const now = Math.floor(Date.now() / 1000);
		const exp = now + Math.floor(this.config.accessTokenTtlMs / 1000);
		const jti = randomUUID();

		const jwt = await new jose.SignJWT({
			scope: scopes.join(' '),
			client_id: clientId,
		} satisfies Partial<OAuthTokenClaims>)
			.setProtectedHeader({alg: this.config.signingAlgorithm, kid: this.kid})
			.setSubject(userId)
			.setIssuer(this.config.issuer)
			.setAudience(this.config.baseUrl)
			.setIssuedAt(now)
			.setExpirationTime(exp)
			.setJti(jti)
			.sign(this.privateKey);

		const tokenHash = createHash('sha256').update(jwt).digest('hex');
		this.tokens.set(tokenHash, {
			_id: randomUUID(),
			__created: Date.now(),
			__updated: Date.now(),
			_v: OAuthToken_DbKey,
			tokenHash,
			clientId,
			userId,
			scopes,
			expiresAt: exp * 1000,
			issuedAt: now * 1000,
			revoked: false,
			tokenType: 'access',
		} as DB_OAuthToken);

		return jwt;
	}

	private async issueRefreshToken(userId: string, clientId: string, scopes: string[]): Promise<string> {
		const refreshToken = randomUUID();
		const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

		this.tokens.set(tokenHash, {
			_id: randomUUID(),
			__created: Date.now(),
			__updated: Date.now(),
			_v: OAuthToken_DbKey,
			tokenHash,
			clientId,
			userId,
			scopes,
			expiresAt: Date.now() + this.config.refreshTokenTtlMs,
			issuedAt: Date.now(),
			revoked: false,
			tokenType: 'refresh',
		} as DB_OAuthToken);

		return refreshToken;
	}

	private getAllSupportedScopes(): string[] {
		const scopes = new Set<string>();
		for (const client of this.clients.values()) {
			for (const scope of client.allowedScopes) {
				scopes.add(scope);
			}
		}
		return Array.from(scopes);
	}

	async createTokenVerifier(): Promise<OAuthTokenVerifier> {
		const self = this;
		return {
			verifyAccessToken: async (token: string) => {
				const {payload} = await jose.jwtVerify(token, self.publicKey, {
					issuer: self.config.issuer,
					audience: self.config.baseUrl,
				});

				const tokenHash = createHash('sha256').update(token).digest('hex');
				const tokenRecord = self.tokens.get(tokenHash);
				if (tokenRecord?.revoked)
					throw new Error('Token has been revoked');

				return {
					clientId: payload.client_id as string,
					scopes: (payload.scope as string)?.split(' ') ?? [],
					expiresAt: payload.exp,
					token,
					extra: {sub: payload.sub, jti: payload.jti},
				};
			},
		};
	}
}

export type OAuthTokenVerifier = {
	verifyAccessToken: (token: string) => Promise<{
		clientId: string;
		scopes: string[];
		expiresAt?: number;
		token: string;
		extra?: Record<string, unknown>;
	}>;
};

const OAuthGrant_DbKey = 'oauth--grants';
const OAuthToken_DbKey = 'oauth--tokens';

export const ModuleBE_OAuthServer = new ModuleBE_OAuthServer_Class();
