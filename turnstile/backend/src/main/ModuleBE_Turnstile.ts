/*
 * @nu-art/turnstile-backend - Fail-closed Cloudflare Turnstile verification for Thunderstorm APIs
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {randomUUID} from 'node:crypto';
import {HttpCodes} from '@nu-art/api-types';
import {SecretKey} from '@nu-art/google-services-backend';
import {HttpException} from '@nu-art/http-client';
import {MemKey_HttpRequest, type ServerApi_Middleware} from '@nu-art/http-server';
import {isErrorOfType, Module} from '@nu-art/ts-common';
import {HeaderName_TurnstileToken, type TurnstileVerifyContext} from '@nu-art/turnstile-shared';
import {evaluateSiteverify, type TurnstileOutcome} from './evaluate.js';
import type {TurnstileSiteverify_Body, TurnstileSiteverify_Response} from './external/api-def.js';
import {ModuleBE_TurnstileSiteverify} from './external/ModuleBE_TurnstileSiteverify.js';

type Config = {
	/** Secret Manager secret holding the Turnstile secret key (a JSON string). */
	secretKeySecretName: string;
	/** Hostnames a token must have been solved on (siteverify `hostname`). Empty accepts any hostname. */
	allowedHostnames: string[];
};

type Resolver = () => string | undefined | Promise<string | undefined>;

/** How the middleware finds the token and the client IP in the current request. */
export type TurnstileMiddlewareOptions = {
	/** Defaults to the `x-turnstile-token` request header (HeaderName_TurnstileToken). */
	resolveToken?: Resolver;
	/** Optional; forwarded to siteverify as `remoteip`. Resolving the client IP is the app's job. */
	resolveRemoteIp?: Resolver;
	context?: TurnstileVerifyContext;
};

/** Siteverify outcome of one HTTP exchange: a verdict, a definitive refusal (4xx), or a transient failure. */
type SiteverifyCall =
	| { kind: 'verdict'; response: TurnstileSiteverify_Response }
	| { kind: 'refused'; status: number }
	| { kind: 'unavailable' };

/**
 * Server-side Cloudflare Turnstile verification. Fails closed: a missing secret, a missing token,
 * a network or 5xx error (after one retry with the same idempotency key), an unsuccessful siteverify,
 * or a hostname / action mismatch all reject.
 *
 * Rejections throw 403 (FORBIDDEN), an unavailable secret throws 503. Every verification logs one
 * structured line that never contains the token, the secret or the IP.
 */
export class ModuleBE_Turnstile_Class
	extends Module<Config> {

	private secret?: Promise<string | undefined>;

	constructor() {
		super();
		this.setDefaultConfig({secretKeySecretName: 'turnstile-secret-key', allowedHostnames: []});
	}

	/** Verifies a token and throws when it is not accepted. */
	async verify(token: string | undefined, remoteIp?: string, context: TurnstileVerifyContext = {}): Promise<void> {
		const outcome = await this.check(token, remoteIp, context);
		this.logInfo(JSON.stringify({event: 'turnstile_siteverify', ...outcome}));
		if (outcome.outcome === 'accepted')
			return;

		if (outcome.reason === 'secret_unavailable')
			throw HttpCodes._5XX.SERVICE_UNAVAILABLE('Bot protection is unavailable. Please try again later.', 'Turnstile secret is unavailable');

		throw HttpCodes._4XX.FORBIDDEN('Bot protection check failed. Please try again.', `Turnstile rejected: ${outcome.reason}`);
	}

	/** Verifies a token and returns the outcome without throwing. */
	async check(token: string | undefined, remoteIp?: string, context: TurnstileVerifyContext = {}): Promise<TurnstileOutcome> {
		const response = token?.trim();
		if (!response)
			return {outcome: 'rejected', reason: 'token_missing'};

		const secret = await this.getSecret();
		if (!secret)
			return {outcome: 'rejected', reason: 'secret_unavailable'};

		const body: TurnstileSiteverify_Body = {
			secret,
			response,
			idempotency_key: context.idempotencyKey?.trim() || randomUUID(),
			...(remoteIp ? {remoteip: remoteIp} : {}),
		};

		const call = await this.callSiteverify(body);
		if (call.kind === 'unavailable')
			return {outcome: 'rejected', reason: 'network_error'};

		if (call.kind === 'refused')
			return {outcome: 'rejected', reason: 'siteverify_failed', errorCodes: [`http_${call.status}`]};

		return evaluateSiteverify(call.response, {
			hostnames: (context.expectedHostnames ?? this.config.allowedHostnames ?? []).map(hostname => hostname.toLowerCase()),
			action: context.expectedAction,
		});
	}

	/**
	 * An http API middleware that verifies the request's token. Register with
	 * `HttpServer.getDefault().addApiMiddleware(apiDef => apiDef === ApiDef_X.y, ModuleBE_Turnstile.middleware())`.
	 */
	middleware(options: TurnstileMiddlewareOptions = {}): ServerApi_Middleware {
		return async () => {
			const token = options.resolveToken ? await options.resolveToken() : MemKey_HttpRequest.get().header(HeaderName_TurnstileToken);
			const remoteIp = options.resolveRemoteIp ? await options.resolveRemoteIp() : undefined;
			await this.verify(token, remoteIp, options.context);
		};
	}

	/** Reads the secret from Secret Manager. A missing secret yields undefined, which fails closed upstream. */
	protected async loadSecret(): Promise<string | undefined> {
		return new SecretKey<string>(this.config.secretKeySecretName).get();
	}

	/** One retry, with the same idempotency key, on a network error or a 5xx. A 4xx is final. */
	private async callSiteverify(body: TurnstileSiteverify_Body): Promise<SiteverifyCall> {
		for (let attempt = 1; attempt <= 2; attempt++) {
			try {
				return {kind: 'verdict', response: await ModuleBE_TurnstileSiteverify.siteverify(body)};
			} catch (e: unknown) {
				const httpException = isErrorOfType(e, HttpException);
				if (!httpException)
					throw e;

				if (httpException.responseCode >= 400 && httpException.responseCode < 500)
					return {kind: 'refused', status: httpException.responseCode};

				this.logWarning(`Turnstile siteverify attempt ${attempt} failed with status ${httpException.responseCode}`);
			}
		}
		return {kind: 'unavailable'};
	}

	private getSecret(): Promise<string | undefined> {
		if (!this.secret)
			this.secret = this.loadSecret().then(secret => {
				if (!secret)
					this.secret = undefined;
				return secret;
			}, (err: unknown) => {
				this.secret = undefined;
				throw err;
			});

		return this.secret;
	}
}

export const ModuleBE_Turnstile = new ModuleBE_Turnstile_Class();
