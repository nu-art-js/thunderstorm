/*
 * @nu-art/ts-email-resend-backend - Resend adapter for ts-email
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import type {AxiosRequestConfig, AxiosResponse} from 'axios';
import {ModuleBE_Email} from '@nu-art/ts-email-backend';
import type {Email} from '@nu-art/ts-email-shared';
import {ModuleBE_ResendApi} from '../main/external/ModuleBE_ResendApi.js';
import {ResendAdapter} from '../main/ResendAdapter.js';

type Reply = { status: number; data?: unknown } | { networkError: true };

const sent: AxiosRequestConfig[] = [];
let replies: Reply[] = [];
let apiKey: string | undefined = 're_test_key';

// Test seam: replace the Secret Manager read and the transport.
Object.defineProperty(ModuleBE_ResendApi, 'loadApiKey', {
	value: async () => {
		if (!apiKey)
			throw new Error('Missing Resend API key secret');
		return apiKey;
	},
});

ModuleBE_ResendApi.client.sendRequest = async (options: AxiosRequestConfig): Promise<AxiosResponse> => {
	sent.push(options);
	const reply = replies.shift();
	if (!reply)
		throw new Error('unexpected Resend call');

	if ('networkError' in reply)
		throw new Error('socket hang up');

	if (reply.status >= 400)
		throw Object.assign(new Error(`status ${reply.status}`), {response: {status: reply.status, data: reply.data ?? {}, headers: {}}});

	return {status: reply.status, data: reply.data, headers: {}, statusText: 'OK', config: options} as AxiosResponse;
};

const email: Email = {
	from: {email: 'noreply@example.com', name: 'Calendar Booking'},
	to: [{email: 'guest@example.com', name: 'Guest'}],
	subject: 'Your booking',
	html: '<p>Confirmed</p>',
	text: 'Confirmed',
};

describe('ts-email-resend - ResendAdapter', () => {
	beforeEach(() => {
		sent.length = 0;
		replies = [];
		apiKey = 're_test_key';
	});

	it('posts the mapped message with the bearer key and returns the message id', async () => {
		replies = [{status: 200, data: {id: 'msg_1'}}];
		const result = await ResendAdapter.send(email);
		expect(result).to.deep.equal({success: true, messageId: 'msg_1'});
		expect(sent).to.have.length(1);
		expect(sent[0].url).to.equal('https://api.resend.com/emails');
		expect(sent[0].method).to.equal('POST');
		expect((sent[0].headers as Record<string, string>).Authorization).to.equal('Bearer re_test_key');
		expect(sent[0].data).to.deep.equal({
			from: '"Calendar Booking" <noreply@example.com>',
			to: ['"Guest" <guest@example.com>'],
			subject: 'Your booking',
			html: '<p>Confirmed</p>',
			text: 'Confirmed',
		});
	});

	it('omits text when the email has none', async () => {
		replies = [{status: 200, data: {id: 'msg_2'}}];
		await ResendAdapter.send({...email, text: undefined});
		expect(sent[0].data).to.not.have.property('text');
	});

	it('maps a Resend refusal to success:false without leaking the key or the recipient', async () => {
		replies = [{status: 422, data: {statusCode: 422, name: 'validation_error', message: 'Invalid `to` field.'}}];
		const result = await ResendAdapter.send(email);
		expect(result.success).to.equal(false);
		expect(result.error).to.equal('Resend refused the message (422): Invalid `to` field.');
		expect(result.error).to.not.contain('re_test_key');
		expect(result.error).to.not.contain('guest@example.com');
	});

	it('maps a transport error to success:false', async () => {
		replies = [{networkError: true}];
		const result = await ResendAdapter.send(email);
		expect(result).to.deep.equal({success: false, error: 'Resend refused the message (500)'});
	});

	it('fails loudly when the key is missing', async () => {
		apiKey = undefined;
		let failed = false;
		try {
			await ResendAdapter.send(email);
		} catch (e: unknown) {
			failed = true;
			expect(String(e)).to.contain('Missing Resend API key');
		}
		expect(failed).to.equal(true);
		expect(sent).to.have.length(0);
	});

	it('is used by ModuleBE_Email once registered', async () => {
		replies = [{status: 200, data: {id: 'msg_3'}}];
		ModuleBE_Email.registerAdapter(ResendAdapter);
		expect(await ModuleBE_Email.send(email)).to.deep.equal({success: true, messageId: 'msg_3'});
	});
});
