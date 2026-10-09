/*
 * @nu-art/email-resend-backend - Transactional email through Resend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ModuleBE_SecretManager} from '@nu-art/google-services-backend';
import {BadImplementationException, ImplementationMissingException, LogLevel, Module} from '@nu-art/ts-common';
import {type CreateEmailOptions, Resend} from 'resend';
import {formatResendAddress} from './format.js';
import type {EmailAddress, ResendEmail, ResendSendResult} from './types.js';

type Config = {
	/** Secret Manager secret holding the Resend API key, stored raw (not JSON-encoded). */
	apiKeySecretName: string;
	/** Sender used when a message has no `from`. */
	defaultFrom?: EmailAddress;
};

/** The part of the Resend SDK this module uses; the seam tests replace. */
export type ResendEmailsClient = Pick<Resend['emails'], 'send'>;

/**
 * Sends transactional mail through Resend. The API key is read raw from Secret Manager and the SDK
 * client is created on the first send, then reused. A Resend refusal returns `{success: false, error}`
 * with the status and Resend's message, never the key or the recipients. A missing key throws.
 */
export class ModuleBE_EmailResend_Class
	extends Module<Config> {

	private client?: Promise<ResendEmailsClient>;

	constructor() {
		super();
		this.setDefaultConfig({apiKeySecretName: 'resend-api-key'});
		// Debug/verbose logs are capped: payloads carry recipients.
		this.setMinLevel(LogLevel.Info);
	}

	async send(email: ResendEmail): Promise<ResendSendResult> {
		const client = await this.getClient();
		const {data, error} = await client.send(this.toResendOptions(email), email.idempotencyKey ? {idempotencyKey: email.idempotencyKey} : undefined);
		if (error || !data) {
			const message = `Resend refused the message (${error?.statusCode ?? 'no status'})${error?.message ? `: ${error.message.slice(0, 200)}` : ''}`;
			this.logError(message);
			return {success: false, error: message};
		}

		this.logInfo(`Resend accepted message ${data.id} for ${email.to.length} recipient(s)`);
		return {success: true, messageId: data.id};
	}

	/** Reads the raw API key from Secret Manager. Fails loudly when it is missing. */
	protected async loadApiKey(): Promise<string> {
		const projectId = process.env.GCP_PROJECT_ID ?? process.env.GCLOUD_PROJECT;
		if (!projectId)
			throw new ImplementationMissingException('Missing GCP_PROJECT_ID / GCLOUD_PROJECT to read the Resend API key');

		const apiKey = (await ModuleBE_SecretManager.tryGetSecretValue({key: this.config.apiKeySecretName, projectId, version: 'latest'}))?.trim();
		if (!apiKey)
			throw new ImplementationMissingException(`Missing Resend API key secret '${this.config.apiKeySecretName}'`);

		return apiKey;
	}

	protected createClient(apiKey: string): ResendEmailsClient {
		return new Resend(apiKey).emails;
	}

	private getClient(): Promise<ResendEmailsClient> {
		if (!this.client)
			this.client = this.loadApiKey()
				.then(apiKey => this.createClient(apiKey))
				.catch((err: Error) => {
					this.client = undefined;
					throw err;
				});

		return this.client;
	}

	private toResendOptions(email: ResendEmail): CreateEmailOptions {
		const from = email.from ?? this.config.defaultFrom;
		if (!from)
			throw new BadImplementationException('Email has no from and ModuleBE_EmailResend has no defaultFrom');

		if (email.html === undefined && email.text === undefined)
			throw new BadImplementationException('Email needs html or text');

		const content = email.html !== undefined
			? {html: email.html, ...(email.text !== undefined ? {text: email.text} : {})}
			: {text: email.text as string};
		const addresses = (list?: EmailAddress[]) => list?.length ? list.map(formatResendAddress) : undefined;
		const cc = addresses(email.cc);
		const bcc = addresses(email.bcc);
		const replyTo = addresses(email.replyTo);
		return {
			from: formatResendAddress(from),
			to: email.to.map(formatResendAddress),
			subject: email.subject,
			...content,
			...(cc ? {cc} : {}),
			...(bcc ? {bcc} : {}),
			...(replyTo ? {replyTo} : {}),
			...(email.headers ? {headers: email.headers} : {}),
			...(email.tags ? {tags: email.tags} : {}),
		};
	}
}

export const ModuleBE_EmailResend = new ModuleBE_EmailResend_Class();
