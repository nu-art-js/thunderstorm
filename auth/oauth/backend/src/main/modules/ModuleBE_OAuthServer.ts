/*
 * @nu-art/oauth-backend - OAuth 2.1 Authorization Server for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {BadImplementationException, ImplementationMissingException, Module, MUSTNeverHappenException} from '@nu-art/ts-common';
import type {TS_Object} from '@nu-art/ts-common';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {ApiHandler, MemKey_HttpRawResponse, MemKey_HttpRequest, MemKey_HttpResponse} from '@nu-art/http-server';
import * as jose from 'jose';
import {randomUUID, createHash} from 'node:crypto';
import type {OAuthServerMetadata, OAuthTokenClaims, OAuthClientRegistrationResponse, OAuthContextBinder, OAuthResourceMatcher} from '@nu-art/oauth-shared';
import {API_OAuth, ApiDef_OAuth, OAuthGrantUserId_PendingConsent, OAuthTokenKind_OAuthJwt, OAuthTokenKind_SessionJwt} from '@nu-art/oauth-shared';
import type {DB_OAuthClient, DB_OAuthGrant} from '@nu-art/oauth-shared';
import {ModuleBE_OAuthClientDB} from './ModuleBE_OAuthClientDB.js';
import {ModuleBE_OAuthGrantDB} from './ModuleBE_OAuthGrantDB.js';
import {ModuleBE_OAuthSigningKeyDB} from './ModuleBE_OAuthSigningKeyDB.js';
import {ModuleBE_OAuthTokenDB} from './ModuleBE_OAuthTokenDB.js';
import {MemKey_AccountId} from '@nu-art/user-account-backend';
import {HttpCodes} from '@nu-art/api-types';

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
	private keysReady!: Promise<void>;
	private userResolver?: OAuthUserResolver;
	private readonly contextBinders: {matches: OAuthResourceMatcher; binder: OAuthContextBinder}[] = [];

	constructor() {
		super();
		this.setDefaultConfig(DefaultConfig);
	}

	setUserResolver(resolver: OAuthUserResolver): this {
		this.userResolver = resolver;
		this.logInfo('OAuth userResolver registered');
		return this;
	}

	// Each module that owns an MCP (or other) resource registers its binder here — the module owns
	// its own consent + session minting; the auth server just holds the registry. A resource with a
	// matching binder is consent-gated and session-JWT backed; a resource with none gets a plain
	// OAuth-JWT auto-grant. The auth server never learns what any resource "means".
	registerContextBinder(matches: OAuthResourceMatcher, binder: OAuthContextBinder): this {
		this.contextBinders.push({matches, binder});
		this.logInfo(`OAuth context binder registered: ${binder.constructor.name} (total=${this.contextBinders.length})`);
		return this;
	}

	protected init(): void {
		this.logInfo(`OAuth server initializing — issuer: '${this.config.issuer}', baseUrl: '${this.config.baseUrl}'`);
		this.logInfo(`OAuth server: userResolver=${!!this.userResolver}, contextBinders=${this.contextBinders.length}`);
		if (!this.config.issuer || !this.config.baseUrl)
			this.logWarningBold('OAuth server issuer and baseUrl must be configured. Using empty defaults.');

		this.keysReady = this.loadOrCreateSigningKey();
	}

	private loadOrCreateSigningKey(): Promise<void> {
		return new MemStorage().init(async () => {
			const alg = this.config.signingAlgorithm;
			const existing = await ModuleBE_OAuthSigningKeyDB.query.unManipulatedQuery({where: {alg}});
			const record = existing[0];

			if (record) {
				this.kid = record.kid;
				const importedPrivate = await jose.importJWK(JSON.parse(record.privateJwk), alg);
				const importedPublic = await jose.importJWK(JSON.parse(record.publicJwk), alg);
				if (importedPrivate instanceof Uint8Array || importedPublic instanceof Uint8Array)
					throw new MUSTNeverHappenException(`OAuth signing key import returned symmetric key material for alg ${alg}`);

				this.privateKey = importedPrivate;
				this.publicKey = importedPublic;
				this.jwk = await jose.exportJWK(this.publicKey);
				this.jwk.kid = this.kid;
				this.jwk.alg = alg;
				this.jwk.use = 'sig';
				this.logInfo(`Loaded persisted OAuth signing key (kid: ${this.kid})`);
				return;
			}

			this.kid = randomUUID();
			const keyPair = alg === 'RS256'
				? await jose.generateKeyPair('RS256', {extractable: true})
				: await jose.generateKeyPair('ES256', {extractable: true});

			this.privateKey = keyPair.privateKey;
			this.publicKey = keyPair.publicKey;

			const privateJwk = await jose.exportJWK(keyPair.privateKey);
			const publicJwk = await jose.exportJWK(keyPair.publicKey);

			await ModuleBE_OAuthSigningKeyDB.create.item({
				kid: this.kid,
				alg,
				privateJwk: JSON.stringify(privateJwk),
				publicJwk: JSON.stringify(publicJwk),
			});

			this.jwk = await jose.exportJWK(this.publicKey);
			this.jwk.kid = this.kid;
			this.jwk.alg = alg;
			this.jwk.use = 'sig';
			this.logInfo(`Generated and persisted new OAuth signing key (kid: ${this.kid})`);
		});
	}

	async registerClient(client: DB_OAuthClient): Promise<void> {
		const existing = (await ModuleBE_OAuthClientDB.query.custom({where: {clientId: client.clientId}, limit: 1}))[0];
		if (existing)
			await ModuleBE_OAuthClientDB.set.item({...existing, ...client});
		else
			await ModuleBE_OAuthClientDB.create.item({
				clientId: client.clientId,
				clientSecret: client.clientSecret,
				name: client.name,
				redirectUris: client.redirectUris,
				allowedScopes: client.allowedScopes,
				clientType: client.clientType,
				enabled: client.enabled,
			});

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
			scopes_supported: await this.getAllSupportedScopes(),
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
		const resource = req.query['resource'] as string | undefined;

		this.logInfo(`/oauth/authorize request:`);
		this.logInfo(`  client_id: ${clientId}`);
		this.logInfo(`  redirect_uri: ${redirectUri}`);
		this.logInfo(`  scope: ${scope}`);
		this.logInfo(`  state: ${state}`);
		this.logInfo(`  resource: ${resource ?? 'none'}`);
		this.logInfo(`  code_challenge: ${codeChallenge}`);
		this.logInfo(`  code_challenge_method: ${codeChallengeMethod}`);
		this.logInfo(`  response_type: ${responseType}`);

		if (responseType !== 'code') {
			this.logWarning(`  REJECTED: unsupported_response_type '${responseType}'`);
			res.status(400).json({error: 'unsupported_response_type'});
			return;
		}

		const client = (await ModuleBE_OAuthClientDB.query.custom({where: {clientId}, limit: 1}))[0];
		if (!client || !client.enabled) {
			const registeredClients = await ModuleBE_OAuthClientDB.query.custom({where: {}});
			this.logWarning(`  REJECTED: invalid_client — clientId '${clientId}' not found (registered: [${registeredClients.map(c => c.clientId).join(', ')}])`);
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
		const requestedScopes = scope?.split(' ').filter(Boolean) ?? [];
		// A binder registered for this resource ⇒ consent-gated + session-JWT. None ⇒ plain OAuth-JWT.
		const binder = this.resolveContextBinder(resource);
		const needsConsent = !!binder;
		this.logInfo(`  binder=${binder?.constructor.name ?? 'none'} needsConsent=${needsConsent} tokenKind=${needsConsent ? OAuthTokenKind_SessionJwt : OAuthTokenKind_OAuthJwt}`);

		const grant = await ModuleBE_OAuthGrantDB.create.item({
			clientId,
			userId: needsConsent ? OAuthGrantUserId_PendingConsent : 'pending-auth',
			scopes: requestedScopes,
			authorizationCode,
			codeChallenge,
			codeChallengeMethod: 'S256',
			redirectUri,
			expiresAt: Date.now() + this.config.authorizationCodeTtlMs,
			used: false,
			resource,
			oauthState: state,
			tokenKind: needsConsent ? OAuthTokenKind_SessionJwt : OAuthTokenKind_OAuthJwt,
		});

		if (binder) {
			const consentUrl = binder.resolveConsentRedirect(grant._id, resource);
			this.logInfo(`  CONSENT REQUIRED: grantId=${grant._id} resource=${resource ?? 'none'} → redirect=${consentUrl}`);
			res.redirect(consentUrl);
			return;
		}

		const redirectUrl = new URL(redirectUri);
		redirectUrl.searchParams.set('code', authorizationCode);
		if (state)
			redirectUrl.searchParams.set('state', state);

		this.logInfo(`  GRANTED: code=${authorizationCode.substring(0, 8)}... → redirect=${redirectUrl.origin}${redirectUrl.pathname}`);
		res.redirect(redirectUrl.toString());
	}

	@ApiHandler(ApiDef_OAuth.consentContext)
	async handleConsentContext(params: API_OAuth['consentContext']['Params']): Promise<API_OAuth['consentContext']['Response']> {
		this.logInfo(`/oauth/consent-context request: authReqId=${params.authReqId}`);
		const {grant, binder} = await this.loadPendingConsentGrant(params.authReqId);
		const accountId = MemKey_AccountId.get();
		this.logInfo(`  grant resource=${grant.resource ?? 'none'} binder=${binder.constructor.name} accountId=${accountId}`);
		const context = await binder.loadConsentContext(accountId, grant.resource);
		this.logInfo(`  consent context loaded: kind=${(context as {kind?: string}).kind ?? 'unknown'}`);
		return context;
	}

	@ApiHandler(ApiDef_OAuth.completeAuthorization)
	async handleCompleteAuthorization(body: API_OAuth['completeAuthorization']['Body']): Promise<API_OAuth['completeAuthorization']['Response']> {
		this.logInfo(`/oauth/complete-authorization request: authReqId=${body.authReqId} context=${body.context ? 'present' : 'none'}`);
		const {grant, binder} = await this.loadPendingConsentGrant(body.authReqId);
		const accountId = MemKey_AccountId.get();
		const deviceId = `oauth-consent-${grant.clientId}`;
		this.logInfo(`  grant resource=${grant.resource ?? 'none'} binder=${binder.constructor.name} accountId=${accountId}`);

		const sessionJwt = await binder.mintSessionJwt({
			accountId,
			deviceId,
			label: `oauth-consent-${grant.clientId}`,
			context: body.context,
		});
		this.logInfo(`  session JWT minted: prefix=${sessionJwt.substring(0, 12)}… len=${sessionJwt.length}`);

		await ModuleBE_OAuthGrantDB.set.item({
			...grant,
			userId: accountId,
			context: body.context,
			sessionJwt,
			used: false,
		});
		this.logInfo(`  grant updated: userId=${accountId} redirectUri=${grant.redirectUri}`);

		return {
			redirectUri: grant.redirectUri,
			code: grant.authorizationCode,
			state: grant.oauthState,
		};
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
		const allowedScopes = body.scope?.split(' ') ?? await this.getAllSupportedScopes();

		const client = await ModuleBE_OAuthClientDB.create.item({
			clientId,
			clientSecret: clientSecret ?? '',
			name: body.client_name ?? `dynamic-client-${clientId.substring(0, 8)}`,
			redirectUris: body.redirect_uris,
			allowedScopes,
			clientType: authMethod === 'none' ? 'public' : 'confidential',
			enabled: true,
		});

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
		await this.keysReady;

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
		const tokenRecord = (await ModuleBE_OAuthTokenDB.query.custom({where: {tokenHash}, limit: 1}))[0];
		if (tokenRecord) {
			await ModuleBE_OAuthTokenDB.set.item({...tokenRecord, revoked: true});
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
		const grant = (await ModuleBE_OAuthGrantDB.query.custom({where: {authorizationCode: code}, limit: 1}))[0];
		if (!grant || grant.used || grant.expiresAt < Date.now()) {
			res.status(400).json({error: 'invalid_grant', error_description: 'Invalid, used, or expired authorization code'});
			return;
		}

		if (grant.userId === OAuthGrantUserId_PendingConsent) {
			res.status(400).json({error: 'invalid_grant', error_description: 'Authorization consent is not complete'});
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

		await ModuleBE_OAuthGrantDB.set.item({...grant, used: true});

		if (grant.tokenKind === OAuthTokenKind_SessionJwt) {
			if (!grant.sessionJwt)
				throw new BadImplementationException('Consent grant is missing sessionJwt');

			const refreshTokenValue = await this.issueRefreshToken(
				grant.userId,
				grant.clientId,
				grant.scopes,
				{
					resource: grant.resource,
					context: grant.context,
					tokenKind: OAuthTokenKind_SessionJwt,
				},
			);

			this.logInfo(`  SESSION JWT ISSUED: clientId=${clientId}, accountId=${grant.userId}`);
			res.json({
				access_token: grant.sessionJwt,
				token_type: 'Bearer',
				expires_in: Math.floor(this.config.accessTokenTtlMs / 1000),
				scope: grant.scopes.join(' '),
				refresh_token: refreshTokenValue,
			});
			return;
		}

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
		const tokenRecord = (await ModuleBE_OAuthTokenDB.query.custom({where: {tokenHash}, limit: 1}))[0];

		if (!tokenRecord || tokenRecord.revoked || tokenRecord.expiresAt < Date.now()) {
			res.status(400).json({error: 'invalid_grant', error_description: 'Invalid or expired refresh token'});
			return;
		}

		if (tokenRecord.clientId !== clientId) {
			res.status(400).json({error: 'invalid_grant', error_description: 'Client ID mismatch'});
			return;
		}

		await ModuleBE_OAuthTokenDB.set.item({...tokenRecord, revoked: true});

		if (tokenRecord.tokenKind === OAuthTokenKind_SessionJwt) {
			const binder = this.resolveContextBinder(tokenRecord.resource);
			if (!binder)
				throw new ImplementationMissingException(`No consent binder registered for resource '${tokenRecord.resource ?? 'none'}' on refresh`);

			const accessToken = await binder.mintSessionJwt({
				accountId: tokenRecord.userId,
				deviceId: `oauth-refresh-${tokenRecord.clientId}`,
				label: `oauth-refresh-${tokenRecord.clientId}`,
				context: tokenRecord.context,
			});
			const newRefreshToken = await this.issueRefreshToken(
				tokenRecord.userId,
				tokenRecord.clientId,
				tokenRecord.scopes,
				{
					resource: tokenRecord.resource,
					context: tokenRecord.context,
					tokenKind: OAuthTokenKind_SessionJwt,
				},
			);

			res.json({
				access_token: accessToken,
				token_type: 'Bearer',
				expires_in: Math.floor(this.config.accessTokenTtlMs / 1000),
				scope: tokenRecord.scopes.join(' '),
				refresh_token: newRefreshToken,
			});
			return;
		}

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
		await this.keysReady;

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
		await ModuleBE_OAuthTokenDB.create.item({
			tokenHash,
			clientId,
			userId,
			scopes,
			expiresAt: exp * 1000,
			issuedAt: now * 1000,
			revoked: false,
			tokenType: 'access',
		});

		return jwt;
	}

	private async issueRefreshToken(
		userId: string,
		clientId: string,
		scopes: string[],
		options?: {
			resource?: string;
			context?: TS_Object;
			tokenKind?: typeof OAuthTokenKind_SessionJwt | typeof OAuthTokenKind_OAuthJwt;
		},
	): Promise<string> {
		const refreshToken = randomUUID();
		const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

		await ModuleBE_OAuthTokenDB.create.item({
			tokenHash,
			clientId,
			userId,
			scopes,
			expiresAt: Date.now() + this.config.refreshTokenTtlMs,
			issuedAt: Date.now(),
			revoked: false,
			tokenType: 'refresh',
			resource: options?.resource,
			context: options?.context,
			tokenKind: options?.tokenKind ?? OAuthTokenKind_OAuthJwt,
		});

		return refreshToken;
	}

	private async getAllSupportedScopes(): Promise<string[]> {
		const clients = await ModuleBE_OAuthClientDB.query.custom({where: {}});
		const scopes = new Set<string>();
		for (const client of clients) {
			for (const scope of client.allowedScopes)
				scopes.add(scope);
		}
		return Array.from(scopes);
	}

	private resolveContextBinder(resource: string | undefined): OAuthContextBinder | undefined {
		const entry = this.contextBinders.find(e => e.matches(resource));
		if (entry)
			this.logInfo(`  resolveContextBinder: resource=${resource ?? 'none'} → ${entry.binder.constructor.name}`);
		else
			this.logInfo(`  resolveContextBinder: resource=${resource ?? 'none'} → none (binders=${this.contextBinders.length})`);
		return entry?.binder;
	}

	private async loadPendingConsentGrant(authReqId: string): Promise<{grant: DB_OAuthGrant; binder: OAuthContextBinder}> {
		const grant = await ModuleBE_OAuthGrantDB.query.uniqueUnmanipulated(authReqId as any);
		if (!grant) {
			this.logWarning(`  loadPendingConsentGrant: NOT FOUND authReqId=${authReqId}`);
			throw HttpCodes._4XX.NOT_FOUND('Authorization request not found');
		}

		this.logInfo(`  loadPendingConsentGrant: authReqId=${authReqId} resource=${grant.resource ?? 'none'} userId=${grant.userId} used=${grant.used} expired=${grant.expiresAt < Date.now()}`);

		const binder = this.resolveContextBinder(grant.resource);
		if (!binder) {
			this.logWarning(`  loadPendingConsentGrant: no binder for resource=${grant.resource ?? 'none'}`);
			throw HttpCodes._4XX.BAD_REQUEST('Authorization request is not a consent-gated grant');
		}

		if (grant.userId !== OAuthGrantUserId_PendingConsent) {
			this.logWarning(`  loadPendingConsentGrant: not pending consent userId=${grant.userId}`);
			throw HttpCodes._4XX.BAD_REQUEST('Authorization request is no longer pending consent');
		}

		if (grant.used || grant.expiresAt < Date.now()) {
			this.logWarning(`  loadPendingConsentGrant: expired or used used=${grant.used} expiresAt=${grant.expiresAt}`);
			throw HttpCodes._4XX.BAD_REQUEST('Authorization request is expired or already used');
		}

		return {grant, binder};
	}

	async createTokenVerifier(): Promise<OAuthTokenVerifier> {
		await this.keysReady;

		const self = this;
		return {
			verifyAccessToken: async (token: string) => {
				const {payload} = await jose.jwtVerify(token, self.publicKey, {
					issuer: self.config.issuer,
					audience: self.config.baseUrl,
				});

				const tokenHash = createHash('sha256').update(token).digest('hex');
				const tokenRecord = (await ModuleBE_OAuthTokenDB.query.custom({where: {tokenHash}, limit: 1}))[0];
				if (tokenRecord?.revoked)
					throw HttpCodes._4XX.UNAUTHORIZED('Token has been revoked');

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

export const ModuleBE_OAuthServer = new ModuleBE_OAuthServer_Class();
