/*
 * @nu-art/oauth-backend - OAuth 2.1 Authorization Server for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Module} from '@nu-art/ts-common';
import {HttpServer} from '@nu-art/http-server';
import type {ExpressRequest, ExpressResponse} from '@nu-art/http-server';
import {SecretKey} from '@nu-art/google-services-backend/modules/ModuleBE_SecretManager';
import * as jose from 'jose';
import {randomUUID, createHash} from 'node:crypto';
import type {OAuthServerMetadata, OAuthTokenClaims} from '@nu-art/oauth-shared';
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
	keySecretName: string;
	projectId?: string;
};

const DefaultConfig: Config = {
	issuer: '',
	baseUrl: '',
	accessTokenTtlMs: 3_600_000,
	refreshTokenTtlMs: 86_400_000 * 30,
	authorizationCodeTtlMs: 600_000,
	signingAlgorithm: 'RS256',
	keySecretName: 'oauth-signing-keys',
};

type PersistedKeyPair = {
	kid: string;
	alg: string;
	privateKeyJwk: jose.JWK;
	publicKeyJwk: jose.JWK;
};

export class ModuleBE_OAuthServer_Class
	extends Module<Config> {

	private privateKey!: jose.KeyLike;
	private publicKey!: jose.KeyLike;
	private jwk!: jose.JWK;
	private kid!: string;
	private keySecret!: SecretKey<string>;

	private readonly clients = new Map<string, DB_OAuthClient>();
	private readonly grants = new Map<string, DB_OAuthGrant>();
	private readonly tokens = new Map<string, DB_OAuthToken>();

	constructor() {
		super();
		this.setDefaultConfig(DefaultConfig);
	}

	protected async init(): Promise<void> {
		if (!this.config.issuer || !this.config.baseUrl)
			this.logWarningBold('OAuth server issuer and baseUrl must be configured. Using empty defaults.');

		this.keySecret = new SecretKey<string>(this.config.keySecretName, this.config.projectId);
		await this.loadOrGenerateKeyPair();
		this.mountRoutes();
	}

	private async loadOrGenerateKeyPair(): Promise<void> {
		const alg = this.config.signingAlgorithm;

		try {
		const raw = await this.keySecret.get();
		const persisted: PersistedKeyPair | undefined = raw ? JSON.parse(raw) : undefined;
		if (persisted && persisted.kid && persisted.privateKeyJwk) {
				this.kid = persisted.kid;
			this.privateKey = await jose.importJWK(persisted.privateKeyJwk, alg) as jose.KeyLike;
			this.publicKey = await jose.importJWK(persisted.publicKeyJwk, alg) as jose.KeyLike;
			this.jwk = {...persisted.publicKeyJwk, kid: this.kid, alg, use: 'sig'};
				this.logInfo(`Loaded persisted key pair (alg: ${alg}, kid: ${this.kid})`);
				return;
			}
		} catch (_err) {
			this.logInfo('No persisted key pair found, generating new one');
		}

		this.kid = randomUUID();
		const {publicKey, privateKey} = await jose.generateKeyPair(alg, {extractable: true});
		this.privateKey = privateKey;
		this.publicKey = publicKey;

		const privateKeyJwk = await jose.exportJWK(privateKey);
		const publicKeyJwk = await jose.exportJWK(publicKey);

		this.jwk = {...publicKeyJwk, kid: this.kid, alg, use: 'sig'};

		const keyPair: PersistedKeyPair = {kid: this.kid, alg, privateKeyJwk, publicKeyJwk};
		await this.keySecret.set(JSON.stringify(keyPair));
		this.logInfo(`Generated and persisted new key pair (alg: ${alg}, kid: ${this.kid})`);
	}

	private userResolver?: OAuthUserResolver;

	registerClient(client: DB_OAuthClient): void {
		this.clients.set(client.clientId, client);
		this.logInfo(`Registered OAuth client: ${client.name} (${client.clientId})`);
	}

	setUserResolver(resolver: OAuthUserResolver): this {
		this.userResolver = resolver;
		return this;
	}

	private mountRoutes(): void {
		const express = HttpServer.getDefault().getExpress();

		express.get('/.well-known/oauth-authorization-server', (_req, res) => {
			this.handleServerMetadata(res);
		});

		express.get('/oauth/authorize', (req, res) => {
			this.handleAuthorize(req, res);
		});

		express.post('/oauth/token', (req, res) => {
			this.handleToken(req, res);
		});

		express.get('/oauth/jwks', (_req, res) => {
			this.handleJwks(res);
		});

		express.post('/oauth/revoke', (req, res) => {
			this.handleRevoke(req, res);
		});

		express.post('/oauth/approve-grant', (req, res) => {
			this.handleApproveGrant(req, res);
		});

		this.logInfo('OAuth 2.1 endpoints mounted');
	}

	private handleServerMetadata(res: ExpressResponse): void {
		const baseUrl = this.config.baseUrl;
		const metadata: OAuthServerMetadata = {
			issuer: this.config.issuer,
			authorization_endpoint: `${baseUrl}/oauth/authorize`,
			token_endpoint: `${baseUrl}/oauth/token`,
			jwks_uri: `${baseUrl}/oauth/jwks`,
			revocation_endpoint: `${baseUrl}/oauth/revoke`,
			scopes_supported: this.getAllSupportedScopes(),
			response_types_supported: ['code'],
			grant_types_supported: ['authorization_code', 'refresh_token'],
			code_challenge_methods_supported: ['S256'],
			token_endpoint_auth_methods_supported: ['none'],
		};
		res.json(metadata);
	}

	private handleAuthorize(req: ExpressRequest, res: ExpressResponse): void {
		const clientId = req.query['client_id'] as string;
		const redirectUri = req.query['redirect_uri'] as string;
		const scope = req.query['scope'] as string;
		const state = req.query['state'] as string;
		const codeChallenge = req.query['code_challenge'] as string;
		const codeChallengeMethod = req.query['code_challenge_method'] as string;
		const responseType = req.query['response_type'] as string;

		if (responseType !== 'code') {
			res.status(400).json({error: 'unsupported_response_type'});
			return;
		}

		const client = this.clients.get(clientId);
		if (!client || !client.enabled) {
			res.status(400).json({error: 'invalid_client', error_description: 'Unknown or disabled client'});
			return;
		}

		if (!client.redirectUris.includes(redirectUri)) {
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

		const pendingId = randomUUID();
		const requestedScopes = scope?.split(' ') ?? [];

		const grant: DB_OAuthGrant = {
			_id: randomUUID(),
			__created: Date.now(),
			__updated: Date.now(),
			_v: OAuthGrant_DbKey,
			clientId,
			userId: 'pending-auth',
			scopes: requestedScopes,
			authorizationCode: pendingId,
			codeChallenge,
			codeChallengeMethod: 'S256',
			redirectUri,
			expiresAt: Date.now() + this.config.authorizationCodeTtlMs,
			used: false,
		} as DB_OAuthGrant;

		this.grants.set(pendingId, grant);
		res.type('html').send(this.renderPasskeyLoginPage(pendingId, client.name, state));
	}

	private async handleApproveGrant(req: ExpressRequest, res: ExpressResponse): Promise<void> {
		const {pendingId} = req.body;
		if (!pendingId) {
			res.status(400).json({error: 'invalid_request', error_description: 'pendingId is required'});
			return;
		}

		const authHeader = req.headers['authorization'] as string | undefined;
		if (!authHeader || !this.userResolver) {
			res.status(401).json({error: 'unauthorized', error_description: 'Session required'});
			return;
		}

		let accountId: string;
		try {
			accountId = await this.userResolver.resolveAccountId(authHeader);
		} catch (err: any) {
			res.status(401).json({error: 'unauthorized', error_description: err.message || 'Invalid session'});
			return;
		}

		const grant = this.grants.get(pendingId);
		if (!grant || grant.used || grant.expiresAt < Date.now()) {
			res.status(400).json({error: 'invalid_grant', error_description: 'Invalid or expired pending grant'});
			return;
		}

		const authorizationCode = randomUUID();
		grant.authorizationCode = authorizationCode;
		grant.userId = accountId;
		this.grants.delete(pendingId);
		this.grants.set(authorizationCode, grant);

		res.json({redirectUri: grant.redirectUri, code: authorizationCode});
	}

	private renderPasskeyLoginPage(pendingId: string, clientName: string, state?: string): string {
		return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Authorize ${clientName}</title>
<style>
body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#0a0a0a;color:#e0e0e0}
.card{background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:2.5rem;max-width:400px;text-align:center}
h2{margin:0 0 .5rem;font-size:1.4rem}
p{color:#888;margin:0 0 1.5rem;font-size:.9rem}
button{background:#2563eb;color:#fff;border:none;border-radius:8px;padding:.75rem 2rem;font-size:1rem;cursor:pointer;width:100%}
button:hover{background:#1d4ed8}
button:disabled{background:#333;cursor:not-allowed}
.error{color:#ef4444;margin-top:1rem;font-size:.85rem}
.spinner{display:none;margin:1rem auto;width:24px;height:24px;border:3px solid #333;border-top:3px solid #2563eb;border-radius:50%;animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
</style></head><body>
<div class="card">
<h2>Authorize ${clientName}</h2>
<p>Sign in with your passkey to continue</p>
<button id="btn" onclick="startLogin()">Sign in with Passkey</button>
<div class="spinner" id="spinner"></div>
<div class="error" id="error"></div>
</div>
<script>
const pendingId='${pendingId}';
const state=${state ? `'${state}'` : 'null'};
async function startLogin(){
const btn=document.getElementById('btn'),spinner=document.getElementById('spinner'),err=document.getElementById('error');
btn.disabled=true;spinner.style.display='block';err.textContent='';
try{
const optRes=await fetch('/v1/auth/passkey/login/options',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
if(!optRes.ok)throw new Error('Failed to get login options');
const{options,challengeId}=await optRes.json();
const cred=await navigator.credentials.get({publicKey:{...options,challenge:Uint8Array.from(atob(options.challenge.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)),allowCredentials:(options.allowCredentials||[]).map(c=>({...c,id:Uint8Array.from(atob(c.id.replace(/-/g,'+').replace(/_/g,'/')),x=>x.charCodeAt(0))}))
}});
const assertionResponse={id:cred.id,rawId:btoa(String.fromCharCode(...new Uint8Array(cred.rawId))).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=/g,''),type:cred.type,response:{authenticatorData:btoa(String.fromCharCode(...new Uint8Array(cred.response.authenticatorData))).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=/g,''),clientDataJSON:btoa(String.fromCharCode(...new Uint8Array(cred.response.clientDataJSON))).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=/g,''),signature:btoa(String.fromCharCode(...new Uint8Array(cred.response.signature))).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=/g,''),userHandle:cred.response.userHandle?btoa(String.fromCharCode(...new Uint8Array(cred.response.userHandle))).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=/g,''):null}};
const verRes=await fetch('/v1/auth/passkey/login/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assertionResponse,challengeId,deviceId:'mcp-oauth-login'})});
if(!verRes.ok)throw new Error('Passkey verification failed');
const sessionJwt=verRes.headers.get('x-jwt-token')||verRes.headers.get('x-session');
const approveRes=await fetch('/oauth/approve-grant',{method:'POST',headers:{'Content-Type':'application/json',...(sessionJwt?{'authorization':sessionJwt}:{})},body:JSON.stringify({pendingId})});
if(!approveRes.ok)throw new Error('Grant approval failed');
const{redirectUri,code}=await approveRes.json();
const url=new URL(redirectUri);url.searchParams.set('code',code);
if(state)url.searchParams.set('state',state);
window.location.href=url.toString();
}catch(e){err.textContent=e.message||'Authentication failed';btn.disabled=false;spinner.style.display='none'}}
</script></body></html>`;
	}

	private async handleToken(req: ExpressRequest, res: ExpressResponse): Promise<void> {
		const {grant_type, code, redirect_uri, code_verifier, client_id, refresh_token} = req.body;

		if (grant_type === 'authorization_code') {
			await this.handleAuthorizationCodeGrant(res, code, redirect_uri, code_verifier, client_id);
		} else if (grant_type === 'refresh_token') {
			await this.handleRefreshTokenGrant(res, refresh_token, client_id);
		} else {
			res.status(400).json({error: 'unsupported_grant_type'});
		}
	}

	private async handleAuthorizationCodeGrant(
		res: ExpressResponse,
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

		res.json({
			access_token: accessToken,
			token_type: 'Bearer',
			expires_in: Math.floor(this.config.accessTokenTtlMs / 1000),
			scope: grant.scopes.join(' '),
			refresh_token: refreshTokenValue,
		});
	}

	private async handleRefreshTokenGrant(
		res: ExpressResponse,
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

	private handleJwks(res: ExpressResponse): void {
		res.json({keys: [this.jwk]});
	}

	private handleRevoke(req: ExpressRequest, res: ExpressResponse): void {
		const {token} = req.body;
		if (!token) {
			res.status(400).json({error: 'invalid_request', error_description: 'token is required'});
			return;
		}

		const tokenHash = createHash('sha256').update(token).digest('hex');
		const tokenRecord = this.tokens.get(tokenHash);
		if (tokenRecord) {
			tokenRecord.revoked = true;
			this.logInfo(`Token revoked for client ${tokenRecord.clientId}`);
		}

		res.status(200).send();
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
		const publicKey = this.publicKey;
		const issuer = this.config.issuer;
		const audience = this.config.baseUrl;
		const tokens = this.tokens;

		return {
			verifyAccessToken: async (token: string) => {
				const {payload} = await jose.jwtVerify(token, publicKey, {
					issuer,
					audience,
				});

				const tokenHash = createHash('sha256').update(token).digest('hex');
				const tokenRecord = tokens.get(tokenHash);
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

export type OAuthUserResolver = {
	resolveAccountId: (sessionJwt: string) => Promise<string>;
};

const OAuthGrant_DbKey = 'oauth--grants';
const OAuthToken_DbKey = 'oauth--tokens';

export const ModuleBE_OAuthServer = new ModuleBE_OAuthServer_Class();
