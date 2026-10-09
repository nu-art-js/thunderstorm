/*
 * @nu-art/turnstile-backend - Fail-closed Cloudflare Turnstile verification for Thunderstorm APIs
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiCaller, HttpClient, type HttpRequest} from '@nu-art/http-client';
import {LogLevel, Module} from '@nu-art/ts-common';
import {
	type API_TurnstileSiteverify,
	ApiDef_TurnstileSiteverify,
	TurnstileSiteverify_Origin
} from './api-def.js';

/**
 * External-API module for Cloudflare siteverify. Owns its own HttpClient and the vendor ApiDef.
 * The request body carries the secret and the token, so request-level logging is capped at Info.
 */
export class ModuleBE_TurnstileSiteverify_Class
	extends Module {

	readonly client: HttpClient = new HttpClient({origin: TurnstileSiteverify_Origin, compress: false}, 'turnstile-siteverify');

	@ApiCaller(ApiDef_TurnstileSiteverify.siteverify, {
		httpClient: (m: ModuleBE_TurnstileSiteverify_Class) => m.client,
		onBeforeExecute: (_m: ModuleBE_TurnstileSiteverify_Class, request: HttpRequest<API_TurnstileSiteverify['siteverify']>) => request.setMinLevel(LogLevel.Info),
	})
	async siteverify(body: API_TurnstileSiteverify['siteverify']['Body']): Promise<API_TurnstileSiteverify['siteverify']['Response']> {
		void body;
		return undefined as unknown as API_TurnstileSiteverify['siteverify']['Response'];
	}
}

export const ModuleBE_TurnstileSiteverify = new ModuleBE_TurnstileSiteverify_Class();
