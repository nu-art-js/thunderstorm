/*
 * @nu-art/turnstile-backend - Fail-closed Cloudflare Turnstile verification for Thunderstorm APIs
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {type ApiDefResolver, type BodyApi, HttpMethod} from '@nu-art/api-types';

/** Cloudflare siteverify request body (JSON form). Third-party contract, owned here. */
export type TurnstileSiteverify_Body = {
	secret: string;
	response: string;
	remoteip?: string;
	idempotency_key?: string;
};

/** Cloudflare siteverify response. Third-party contract, owned here. */
export type TurnstileSiteverify_Response = {
	success: boolean;
	'error-codes'?: string[];
	challenge_ts?: string;
	hostname?: string;
	action?: string;
	cdata?: string;
};

export type API_TurnstileSiteverify = {
	siteverify: BodyApi<TurnstileSiteverify_Response, TurnstileSiteverify_Body>;
};

export const TurnstileSiteverify_Origin = 'https://challenges.cloudflare.com';

export const ApiDef_TurnstileSiteverify: ApiDefResolver<API_TurnstileSiteverify> = {
	siteverify: {method: HttpMethod.POST, path: '/turnstile/v0/siteverify', timeout: 10_000},
};
