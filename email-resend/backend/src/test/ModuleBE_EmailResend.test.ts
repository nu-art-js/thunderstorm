/*
 * @nu-art/email-resend-backend - Transactional email through Resend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import type {CreateEmailOptions, CreateEmailRequestOptions, CreateEmailResponse} from 'resend';
import {ModuleBE_EmailResend_Class, type ResendEmailsClient} from '../main/ModuleBE_EmailResend.js';
import type {ResendEmail} from '../main/types.js';

type Sent = { options: CreateEmailOptions; requestOptions?: CreateEmailRequestOptions };

/** Test seam: the key read and the SDK client are replaced; counts how often each is created. */
class TestEmailResend_Class
	extends ModuleBE_EmailResend_Class {

	apiKey: string | undefined = 're_test_key';
	keyReads = 0;
	clientsCreated: string[] = [];
	sent: Sent[] = [];
	replies: CreateEmailResponse[] = [];

	protected async loadApiKey(): Promise<string> {
		this.keyReads++;
		if (!this.apiKey)
			throw new Error('Missing Resend API key secret');
		return this.apiKey;
	}

	protected createClient(apiKey: string): ResendEmailsClient {
		this.clientsCreated.push(apiKey);
		return {
			send: async (options: CreateEmailOptions, requestOptions?: CreateEmailRequestOptions) => {
				this.sent.push({options, requestOptions});
				const reply = this.replies.shift();
				if (!reply)
					throw new Error('unexpected Resend call');
				return reply;
			},
		};
	}
}

const ok = (id: string): CreateEmailResponse => ({data: {id}, error: null, headers: null});
const email: ResendEmail = {
	from: {email: 'noreply@example.com', name: 'Calendar Booking'},
	to: [{email: 'guest@example.com', name: 'Guest'}],
	subject: 'Your booking',
	html: '<p>Confirmed</p>',
	text: 'Confirmed',
};

describe('email-resend - ModuleBE_EmailResend', () => {
	let Resend: TestEmailResend_Class;
	beforeEach(() => {
		Resend = new TestEmailResend_Class();
	});

	it('sends the mapped message and returns the message id', async () => {
		Resend.replies = [ok('msg_1')];
		expect(await Resend.send(email)).to.deep.equal({success: true, messageId: 'msg_1'});
		expect(Resend.sent).to.have.length(1);
		expect(Resend.sent[0].options).to.deep.equal({
			from: '"Calendar Booking" <noreply@example.com>',
			to: ['"Guest" <guest@example.com>'],
			subject: 'Your booking',
			html: '<p>Confirmed</p>',
			text: 'Confirmed',
		});
		expect(Resend.sent[0].requestOptions).to.equal(undefined);
	});

	it('does not touch the key or the SDK before the first send, then reuses the client', async () => {
		expect(Resend.keyReads).to.equal(0);
		expect(Resend.clientsCreated).to.deep.equal([]);
		Resend.replies = [ok('a'), ok('b')];
		await Resend.send(email);
		await Resend.send(email);
		expect(Resend.keyReads).to.equal(1);
		expect(Resend.clientsCreated).to.deep.equal(['re_test_key']);
	});

	it('passes cc, bcc, replyTo, headers, tags and the idempotency key', async () => {
		Resend.replies = [ok('msg_2')];
		await Resend.send({
			...email,
			text: undefined,
			cc: [{email: 'cc@example.com'}],
			bcc: [{email: 'bcc@example.com'}],
			replyTo: [{email: 'host@example.com', name: 'Host'}],
			headers: {'X-Entity-Ref-ID': 'b1'},
			tags: [{name: 'kind', value: 'confirmation'}],
			idempotencyKey: 'booking-b1-confirmation',
		});
		const {options, requestOptions} = Resend.sent[0];
		expect(options).to.not.have.property('text');
		expect(options).to.include({subject: 'Your booking'});
		expect((options as {cc: string[]}).cc).to.deep.equal(['cc@example.com']);
		expect((options as {bcc: string[]}).bcc).to.deep.equal(['bcc@example.com']);
		expect((options as {replyTo: string[]}).replyTo).to.deep.equal(['"Host" <host@example.com>']);
		expect(requestOptions).to.deep.equal({idempotencyKey: 'booking-b1-confirmation'});
	});

	it('uses defaultFrom when the message has no from', async () => {
		Resend.setDefaultConfig({defaultFrom: {email: 'default@example.com'}});
		Resend.replies = [ok('msg_3')];
		await Resend.send({...email, from: undefined});
		expect(Resend.sent[0].options.from).to.equal('default@example.com');
	});

	it('maps a Resend refusal to success:false without leaking the key or the recipient', async () => {
		Resend.replies = [{data: null, error: {statusCode: 422, name: 'validation_error', message: 'Invalid `to` field.'}, headers: null}];
		const result = await Resend.send(email);
		expect(result).to.deep.equal({success: false, error: 'Resend refused the message (422): Invalid `to` field.'});
		expect(JSON.stringify(result)).to.not.contain('re_test_key').and.not.contain('guest@example.com');
	});

	it('fails loudly when the key is missing, and retries the read on the next send', async () => {
		Resend.apiKey = undefined;
		let failed = false;
		try {
			await Resend.send(email);
		} catch (e: unknown) {
			failed = true;
			expect(String(e)).to.contain('Missing Resend API key');
		}
		expect(failed).to.equal(true);
		expect(Resend.sent).to.have.length(0);

		Resend.apiKey = 're_later';
		Resend.replies = [ok('msg_4')];
		expect(await Resend.send(email)).to.deep.equal({success: true, messageId: 'msg_4'});
		expect(Resend.clientsCreated).to.deep.equal(['re_later']);
	});

	it('refuses a message without html and text', async () => {
		let failed = false;
		try {
			await Resend.send({...email, html: undefined, text: undefined});
		} catch (e: unknown) {
			failed = true;
		}
		expect(failed).to.equal(true);
	});
});
