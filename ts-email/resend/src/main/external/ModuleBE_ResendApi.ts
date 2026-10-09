/*
 * @nu-art/ts-email-resend-backend - Resend adapter for ts-email
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {SecretKey} from '@nu-art/google-services-backend';
import {ApiCaller, HttpClient, type HttpRequest} from '@nu-art/http-client';
import {ImplementationMissingException, LogLevel, Module} from '@nu-art/ts-common';
import {type API_ResendApi, ApiDef_ResendApi, ResendApi_Origin} from './api-def.js';

type Config = {
	/** Secret Manager secret holding the Resend API key (a JSON string). */
	apiKeySecretName: string;
};

/**
 * External-API module for Resend. Owns its own HttpClient and the vendor ApiDef, and attaches the
 * bearer key per request. Request-level logging is capped at Info because headers carry the key.
 */
export class ModuleBE_ResendApi_Class
	extends Module<Config> {

	readonly client: HttpClient = new HttpClient({origin: ResendApi_Origin, compress: false}, 'resend-api');
	private apiKey?: Promise<string>;

	constructor() {
		super();
		this.setDefaultConfig({apiKeySecretName: 'resend-api-key'});
	}

	@ApiCaller(ApiDef_ResendApi.sendEmail, {
		httpClient: (m: ModuleBE_ResendApi_Class) => m.client,
		onBeforeExecute: (m: ModuleBE_ResendApi_Class, request: HttpRequest<API_ResendApi['sendEmail']>) => m.authorize(request),
	})
	async sendEmail(body: API_ResendApi['sendEmail']['Body']): Promise<API_ResendApi['sendEmail']['Response']> {
		void body;
		return undefined as unknown as API_ResendApi['sendEmail']['Response'];
	}

	/** Reads the key from Secret Manager. Fails loudly when it is missing. */
	protected async loadApiKey(): Promise<string> {
		const apiKey = await new SecretKey<string>(this.config.apiKeySecretName).get();
		if (!apiKey)
			throw new ImplementationMissingException(`Missing Resend API key secret '${this.config.apiKeySecretName}'`);

		return apiKey;
	}

	private async authorize(request: HttpRequest<API_ResendApi['sendEmail']>): Promise<void> {
		request.setMinLevel(LogLevel.Info);
		request.setHeader('Authorization', `Bearer ${await this.getApiKey()}`);
	}

	private getApiKey(): Promise<string> {
		if (!this.apiKey)
			this.apiKey = this.loadApiKey().catch((err: unknown) => {
				this.apiKey = undefined;
				throw err;
			});

		return this.apiKey;
	}
}

export const ModuleBE_ResendApi = new ModuleBE_ResendApi_Class();
