/*
 * @nu-art/saml-backend — SAML 2.0 authentication for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {ApiDef_SAML} from '@nu-art/saml-shared';
import {QueryParam_Email, QueryParam_RedirectUrl, QueryParam_SessionId} from '@nu-art/user-account-shared';
import {decode} from '@nu-art/ts-common';
import {resolveAssertion} from '../main/ModuleBE_SAML.js';
import type {SamlIdpResponse} from '../main/ModuleBE_SAML.js';

describe('ApiDef_SAML contract', () => {
	it('loginSaml uses GET method', () => {
		expect(ApiDef_SAML.loginSaml.method).to.equal('get');
	});

	it('loginSaml has path /v1/saml/login', () => {
		expect(ApiDef_SAML.loginSaml.path).to.equal('/v1/saml/login');
	});

	it('assertSAML uses POST method', () => {
		expect(ApiDef_SAML.assertSAML.method).to.equal('post');
	});

	it('assertSAML has path /v1/saml/assert', () => {
		expect(ApiDef_SAML.assertSAML.path).to.equal('/v1/saml/assert');
	});
});

describe('SAML redirect URL substitution', () => {
	const substituteRedirectUrl = (redirectUrl: string, sessionIdJwt: string, email: string): string => {
		let result = redirectUrl;
		result = result.replace(new RegExp(QueryParam_SessionId.toUpperCase(), 'g'), encodeURIComponent(sessionIdJwt));
		result = result.replace(new RegExp(QueryParam_Email.toUpperCase(), 'g'), encodeURIComponent(email));
		return result;
	};

	it('replaces session ID placeholder with JWT', () => {
		const url = `https://app.example.com/callback?session=${QueryParam_SessionId.toUpperCase()}`;
		const result = substituteRedirectUrl(url, 'eyJhbGciOiJFUzI1NiJ9.test', 'user@example.com');
		expect(result).to.include('eyJhbGciOiJFUzI1NiJ9.test');
		expect(result).to.not.include(QueryParam_SessionId.toUpperCase());
	});

	it('replaces email placeholder with encoded email', () => {
		const url = `https://app.example.com/callback?email=${QueryParam_Email.toUpperCase()}`;
		const result = substituteRedirectUrl(url, 'jwt-token', 'user@example.com');
		expect(result).to.include(encodeURIComponent('user@example.com'));
		expect(result).to.not.include(QueryParam_Email.toUpperCase());
	});

	it('replaces multiple occurrences of the same placeholder', () => {
		const sessionPlaceholder = QueryParam_SessionId.toUpperCase();
		const url = `https://app.example.com?s1=${sessionPlaceholder}&s2=${sessionPlaceholder}`;
		const result = substituteRedirectUrl(url, 'my-jwt', 'a@b.com');
		const count = (result.match(/my-jwt/g) || []).length;
		expect(count).to.equal(2);
	});

	it('handles both placeholders in one URL', () => {
		const url = `https://app.example.com?session=${QueryParam_SessionId.toUpperCase()}&email=${QueryParam_Email.toUpperCase()}`;
		const result = substituteRedirectUrl(url, 'jwt123', 'test@test.com');
		expect(result).to.include('jwt123');
		expect(result).to.include(encodeURIComponent('test@test.com'));
		expect(result).to.not.include(QueryParam_SessionId.toUpperCase());
		expect(result).to.not.include(QueryParam_Email.toUpperCase());
	});

	it('encodes special characters in JWT and email', () => {
		const url = `https://app.example.com?s=${QueryParam_SessionId.toUpperCase()}&e=${QueryParam_Email.toUpperCase()}`;
		const result = substituteRedirectUrl(url, 'jwt+with/special=chars', 'user+tag@example.com');
		expect(result).to.include(encodeURIComponent('jwt+with/special=chars'));
		expect(result).to.include(encodeURIComponent('user+tag@example.com'));
	});

	it('leaves URL untouched when no placeholders present', () => {
		const url = 'https://app.example.com/callback?key=value';
		const result = substituteRedirectUrl(url, 'jwt', 'a@b.com');
		expect(result).to.equal(url);
	});
});

describe('SAML RelayState parsing', () => {
	it('round-trips login context through JSON stringify/parse', () => {
		const loginContext = {[QueryParam_RedirectUrl]: 'https://app.example.com/callback', deviceId: 'device-abc-123'};
		const relayState = JSON.stringify(loginContext);
		const parsed = JSON.parse(relayState);
		expect(parsed[QueryParam_RedirectUrl]).to.equal(loginContext[QueryParam_RedirectUrl]);
		expect(parsed.deviceId).to.equal(loginContext.deviceId);
	});

	it('preserves URL-encoded characters in redirect URL through relay state', () => {
		const loginContext = {
			[QueryParam_RedirectUrl]: `https://app.example.com/callback?session=${QueryParam_SessionId.toUpperCase()}&email=${QueryParam_Email.toUpperCase()}`,
			deviceId: 'dev-1'
		};
		const parsed = JSON.parse(JSON.stringify(loginContext));
		expect(parsed[QueryParam_RedirectUrl]).to.include(QueryParam_SessionId.toUpperCase());
		expect(parsed[QueryParam_RedirectUrl]).to.include(QueryParam_Email.toUpperCase());
	});

	it('throws on invalid JSON relay state', () => {
		expect(() => JSON.parse('not-json')).to.throw();
	});
});

describe('SAML certificate decode', () => {
	it('decodes base64-encoded certificate string', () => {
		const plainCert = 'MIICpDCCAYwCCQDU+Fk3M6UTBTA';
		const encoded = Buffer.from(plainCert).toString('base64');
		const decoded = decode(encoded);
		expect(decoded).to.equal(plainCert);
	});

	it('decodes multiple certificates independently', () => {
		const certs = ['cert-one', 'cert-two', 'cert-three'];
		const encoded = certs.map(c => Buffer.from(c).toString('base64'));
		const decoded = encoded.map(c => decode(c));
		expect(decoded).to.deep.equal(certs);
	});
});

describe('SAML query param constants', () => {
	it('QueryParam_SessionId equals Authorization header key', () => {
		expect(QueryParam_SessionId).to.equal('Authorization');
	});

	it('QueryParam_Email is userEmail', () => {
		expect(QueryParam_Email).to.equal('userEmail');
	});

	it('QueryParam_RedirectUrl is redirectUrl', () => {
		expect(QueryParam_RedirectUrl).to.equal('redirectUrl');
	});

	it('session ID and email uppercased placeholders are distinct', () => {
		expect(QueryParam_SessionId.toUpperCase()).to.not.equal(QueryParam_Email.toUpperCase());
	});
});

describe('resolveAssertion', () => {

	const makeIdpResponse = (nameId: string): SamlIdpResponse => ({
		response_header: {
			version: '2.0',
			destination: 'https://app.example.com/assert',
			in_response_to: '_req123',
			id: '_resp456'
		},
		type: 'authn_response',
		user: {
			name_id: nameId,
			session_index: '_session789',
			attributes: {}
		}
	});

	const makeRelayState = (redirectUrl: string, deviceId: string): string =>
		JSON.stringify({[QueryParam_RedirectUrl]: redirectUrl, deviceId});

	it('extracts userId from response name_id', () => {
		const response = makeIdpResponse('alice@example.com');
		const relayState = makeRelayState('https://app.example.com', 'dev-1');
		const result = resolveAssertion(response, relayState);
		expect(result.userId).to.equal('alice@example.com');
	});

	it('parses loginContext from RelayState JSON', () => {
		const response = makeIdpResponse('bob@example.com');
		const relayState = makeRelayState('https://app.example.com/cb', 'device-abc');
		const result = resolveAssertion(response, relayState);
		expect(result.loginContext[QueryParam_RedirectUrl]).to.equal('https://app.example.com/cb');
		expect(result.loginContext.deviceId).to.equal('device-abc');
	});

	it('preserves the full IdP response', () => {
		const response = makeIdpResponse('carol@example.com');
		const relayState = makeRelayState('https://app.example.com', 'dev-2');
		const result = resolveAssertion(response, relayState);
		expect(result.fullResponse).to.equal(response);
		expect(result.fullResponse.type).to.equal('authn_response');
		expect(result.fullResponse.response_header.id).to.equal('_resp456');
	});

	it('throws when relayState is undefined', () => {
		const response = makeIdpResponse('dave@example.com');
		expect(() => resolveAssertion(response, undefined)).to.throw('LoginContext lost along the way');
	});

	it('throws when relayState is empty string', () => {
		const response = makeIdpResponse('eve@example.com');
		expect(() => resolveAssertion(response, '')).to.throw('LoginContext lost along the way');
	});

	it('throws on invalid JSON in relayState', () => {
		const response = makeIdpResponse('frank@example.com');
		expect(() => resolveAssertion(response, 'not-valid-json')).to.throw();
	});

	it('preserves URL placeholders in loginContext redirect URL', () => {
		const urlWithPlaceholders = `https://app.example.com/cb?session=${QueryParam_SessionId.toUpperCase()}&email=${QueryParam_Email.toUpperCase()}`;
		const response = makeIdpResponse('grace@example.com');
		const relayState = makeRelayState(urlWithPlaceholders, 'dev-3');
		const result = resolveAssertion(response, relayState);
		expect(result.loginContext[QueryParam_RedirectUrl]).to.include(QueryParam_SessionId.toUpperCase());
		expect(result.loginContext[QueryParam_RedirectUrl]).to.include(QueryParam_Email.toUpperCase());
	});

	it('handles special characters in name_id', () => {
		const response = makeIdpResponse('user+tag@example.com');
		const relayState = makeRelayState('https://app.example.com', 'dev-4');
		const result = resolveAssertion(response, relayState);
		expect(result.userId).to.equal('user+tag@example.com');
	});
});
