/*
 * @nu-art/oauth-backend - OAuth 2.1 Authorization Server for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import * as jose from 'jose';
import {createHash, randomUUID} from 'node:crypto';

describe('PKCE S256', () => {
	const computeS256Challenge = (verifier: string): string =>
		createHash('sha256').update(verifier).digest('base64url');

	it('produces consistent challenge for the same verifier', () => {
		const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
		const challenge1 = computeS256Challenge(verifier);
		const challenge2 = computeS256Challenge(verifier);
		expect(challenge1).to.equal(challenge2);
	});

	it('produces different challenges for different verifiers', () => {
		const challenge1 = computeS256Challenge('verifier-alpha');
		const challenge2 = computeS256Challenge('verifier-beta');
		expect(challenge1).to.not.equal(challenge2);
	});

	it('matches the RFC 7636 example (base64url, no padding)', () => {
		const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
		const challenge = computeS256Challenge(verifier);

		// RFC 7636 Appendix B: S256(verifier) = E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
		expect(challenge).to.equal('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
	});

	it('result is base64url encoded (no +, /, or = characters)', () => {
		for (let i = 0; i < 20; i++) {
			const verifier = randomUUID();
			const challenge = computeS256Challenge(verifier);
			expect(challenge).to.not.match(/[+/=]/);
		}
	});
});

describe('JWT sign/verify round-trip', () => {
	const issuer = 'https://auth.test.example';
	const audience = 'https://api.test.example';

	let privateKey: jose.KeyLike;
	let publicKey: jose.KeyLike;
	let kid: string;

	before(async () => {
		kid = randomUUID();
		const keyPair = await jose.generateKeyPair('RS256', {extractable: true});
		privateKey = keyPair.privateKey;
		publicKey = keyPair.publicKey;
	});

	const signToken = async (claims: {sub: string; clientId: string; scopes: string[]}): Promise<string> => {
		const now = Math.floor(Date.now() / 1000);
		return new jose.SignJWT({
			scope: claims.scopes.join(' '),
			client_id: claims.clientId,
		})
			.setProtectedHeader({alg: 'RS256', kid})
			.setSubject(claims.sub)
			.setIssuer(issuer)
			.setAudience(audience)
			.setIssuedAt(now)
			.setExpirationTime(now + 3600)
			.setJti(randomUUID())
			.sign(privateKey);
	};

	it('verifies a self-signed token with correct issuer and audience', async () => {
		const token = await signToken({sub: 'user-1', clientId: 'client-1', scopes: ['read', 'write']});
		const {payload} = await jose.jwtVerify(token, publicKey, {issuer, audience});

		expect(payload.sub).to.equal('user-1');
		expect(payload.client_id).to.equal('client-1');
		expect(payload.scope).to.equal('read write');
		expect(payload.iss).to.equal(issuer);
		expect(payload.aud).to.equal(audience);
	});

	it('rejects token with wrong issuer', async () => {
		const token = await signToken({sub: 'user-1', clientId: 'c', scopes: []});
		try {
			await jose.jwtVerify(token, publicKey, {issuer: 'https://wrong.example', audience});
			expect.fail('Should have thrown');
		} catch (err: any) {
			expect(err.code).to.equal('ERR_JWT_CLAIM_VALIDATION_FAILED');
		}
	});

	it('rejects token with wrong audience', async () => {
		const token = await signToken({sub: 'user-1', clientId: 'c', scopes: []});
		try {
			await jose.jwtVerify(token, publicKey, {issuer, audience: 'https://wrong.example'});
			expect.fail('Should have thrown');
		} catch (err: any) {
			expect(err.code).to.equal('ERR_JWT_CLAIM_VALIDATION_FAILED');
		}
	});

	it('rejects token signed with a different key', async () => {
		const otherKeys = await jose.generateKeyPair('RS256');
		const token = await new jose.SignJWT({scope: '', client_id: 'x'})
			.setProtectedHeader({alg: 'RS256'})
			.setSubject('u')
			.setIssuer(issuer)
			.setAudience(audience)
			.setExpirationTime('1h')
			.sign(otherKeys.privateKey);

		try {
			await jose.jwtVerify(token, publicKey, {issuer, audience});
			expect.fail('Should have thrown');
		} catch (err: any) {
			expect(err.code).to.equal('ERR_JWS_SIGNATURE_VERIFICATION_FAILED');
		}
	});

	it('includes exp, iat, and jti claims', async () => {
		const token = await signToken({sub: 'user-1', clientId: 'c', scopes: []});
		const {payload} = await jose.jwtVerify(token, publicKey, {issuer, audience});

		expect(payload.exp).to.be.a('number');
		expect(payload.iat).to.be.a('number');
		expect(payload.jti).to.be.a('string');
		expect(payload.exp!).to.be.greaterThan(payload.iat!);
	});

	it('supports ES256 signing algorithm', async () => {
		const esKeys = await jose.generateKeyPair('ES256', {extractable: true});
		const token = await new jose.SignJWT({scope: 'admin', client_id: 'es-client'})
			.setProtectedHeader({alg: 'ES256'})
			.setSubject('user-es')
			.setIssuer(issuer)
			.setAudience(audience)
			.setExpirationTime('1h')
			.sign(esKeys.privateKey);

		const {payload} = await jose.jwtVerify(token, esKeys.publicKey, {issuer, audience});
		expect(payload.sub).to.equal('user-es');
		expect(payload.scope).to.equal('admin');
	});
});

describe('JWKS export', () => {
	it('exports public key as JWK with kid, alg, and use', async () => {
		const kid = randomUUID();
		const {publicKey} = await jose.generateKeyPair('RS256', {extractable: true});
		const jwk = await jose.exportJWK(publicKey);
		jwk.kid = kid;
		jwk.alg = 'RS256';
		jwk.use = 'sig';

		expect(jwk.kid).to.equal(kid);
		expect(jwk.alg).to.equal('RS256');
		expect(jwk.use).to.equal('sig');
		expect(jwk.kty).to.equal('RSA');
		expect(jwk.n).to.be.a('string');
		expect(jwk.e).to.be.a('string');
		expect(jwk.d).to.be.undefined;
	});
});

describe('Token revocation detection', () => {
	it('detects revoked token by hash lookup', () => {
		const tokenStore = new Map<string, {revoked: boolean}>();
		const token = 'eyJhbGciOiJSUzI1NiJ9.fake.token';
		const tokenHash = createHash('sha256').update(token).digest('hex');

		tokenStore.set(tokenHash, {revoked: false});
		expect(tokenStore.get(tokenHash)?.revoked).to.be.false;

		tokenStore.get(tokenHash)!.revoked = true;
		expect(tokenStore.get(tokenHash)?.revoked).to.be.true;
	});

	it('returns undefined for unknown token', () => {
		const tokenStore = new Map<string, {revoked: boolean}>();
		const tokenHash = createHash('sha256').update('unknown-token').digest('hex');
		expect(tokenStore.get(tokenHash)).to.be.undefined;
	});

	it('uses SHA-256 hex for consistent hashing', () => {
		const token = 'test-access-token-value';
		const hash1 = createHash('sha256').update(token).digest('hex');
		const hash2 = createHash('sha256').update(token).digest('hex');
		expect(hash1).to.equal(hash2);
		expect(hash1).to.match(/^[0-9a-f]{64}$/);
	});
});
