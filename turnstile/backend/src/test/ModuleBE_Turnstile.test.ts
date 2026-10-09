/*
 * @nu-art/turnstile-backend - Fail-closed Cloudflare Turnstile verification for Thunderstorm APIs
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import type {AxiosRequestConfig, AxiosResponse} from 'axios';
import {ApiException, isErrorOfType} from '@nu-art/ts-common';
import {ModuleBE_Turnstile_Class} from '../main/ModuleBE_Turnstile.js';
import {ModuleBE_TurnstileSiteverify} from '../main/external/ModuleBE_TurnstileSiteverify.js';
import type {TurnstileSiteverify_Body} from '../main/external/api-def.js';

type Reply = { status: number; data?: unknown } | { networkError: true };

/** ModuleBE_Turnstile with a controllable secret, so tests do not need Secret Manager. */
class TestTurnstile_Class
	extends ModuleBE_Turnstile_Class {

	secretValue: string | undefined = 'test-secret';

	protected async loadSecret(): Promise<string | undefined> {
		return this.secretValue;
	}
}

const sent: { url?: string; body: TurnstileSiteverify_Body }[] = [];
let replies: Reply[] = [];

ModuleBE_TurnstileSiteverify.client.sendRequest = async (options: AxiosRequestConfig): Promise<AxiosResponse> => {
	sent.push({url: options.url, body: options.data as TurnstileSiteverify_Body});
	const reply = replies.shift();
	if (!reply)
		throw new Error('unexpected siteverify call');

	if ('networkError' in reply)
		throw new Error('socket hang up');

	if (reply.status >= 400)
		throw Object.assign(new Error(`status ${reply.status}`), {response: {status: reply.status, data: reply.data ?? {}, headers: {}}});

	return {status: reply.status, data: reply.data, headers: {}, statusText: 'OK', config: options} as AxiosResponse;
};

async function expectApiError(action: Promise<unknown>, code: number): Promise<void> {
	try {
		await action;
	} catch (e: unknown) {
		expect(isErrorOfType(e, ApiException)?.responseCode).to.equal(code);
		return;
	}
	throw new Error(`expected an ApiException ${code}`);
}

describe('turnstile - ModuleBE_Turnstile', () => {
	let Turnstile: TestTurnstile_Class;

	beforeEach(() => {
		Turnstile = new TestTurnstile_Class();
		Turnstile.setDefaultConfig({allowedHostnames: ['app.example.com']});
		sent.length = 0;
		replies = [];
	});

	it('accepts a valid token and calls siteverify with secret, token, ip and an idempotency key', async () => {
		replies = [{status: 200, data: {success: true, hostname: 'app.example.com'}}];
		await Turnstile.verify(' token-1 ', '203.0.113.7');
		expect(sent).to.have.length(1);
		expect(sent[0].url).to.equal('https://challenges.cloudflare.com/turnstile/v0/siteverify');
		expect(sent[0].body).to.include({secret: 'test-secret', response: 'token-1', remoteip: '203.0.113.7'});
		expect(sent[0].body.idempotency_key).to.be.a('string').and.not.empty;
	});

	it('rejects a missing token with 403 without calling siteverify', async () => {
		await expectApiError(Turnstile.verify('  '), 403);
		expect(sent).to.have.length(0);
	});

	it('fails closed with 503 when the secret is unavailable', async () => {
		Turnstile.secretValue = undefined;
		await expectApiError(Turnstile.verify('token'), 503);
		expect(sent).to.have.length(0);
	});

	it('rejects success:false with 403', async () => {
		replies = [{status: 200, data: {success: false, 'error-codes': ['timeout-or-duplicate']}}];
		await expectApiError(Turnstile.verify('token'), 403);
	});

	it('rejects a hostname outside the config list with 403', async () => {
		replies = [{status: 200, data: {success: true, hostname: 'evil.example.net'}}];
		await expectApiError(Turnstile.verify('token'), 403);
	});

	it('per-call expected hostnames override the config list', async () => {
		replies = [{status: 200, data: {success: true, hostname: 'other.example.com'}}];
		await Turnstile.verify('token', undefined, {expectedHostnames: ['other.example.com']});
	});

	it('retries once on a 5xx with the same idempotency key', async () => {
		replies = [{status: 503}, {status: 200, data: {success: true, hostname: 'app.example.com'}}];
		await Turnstile.verify('token', undefined, {idempotencyKey: 'idem-1'});
		expect(sent.map(call => call.body.idempotency_key)).to.deep.equal(['idem-1', 'idem-1']);
	});

	it('fails closed after two network errors', async () => {
		replies = [{networkError: true}, {networkError: true}];
		const outcome = await Turnstile.check('token');
		expect(outcome).to.deep.equal({outcome: 'rejected', reason: 'network_error'});
		expect(sent).to.have.length(2);
	});

	it('does not retry a 4xx', async () => {
		replies = [{status: 400, data: {success: false}}];
		const outcome = await Turnstile.check('token');
		expect(outcome).to.deep.equal({outcome: 'rejected', reason: 'siteverify_failed', errorCodes: ['http_400']});
		expect(sent).to.have.length(1);
	});
});
