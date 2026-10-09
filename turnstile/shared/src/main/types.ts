/*
 * @nu-art/turnstile-shared - Cloudflare Turnstile contract shared by frontend and backend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

/**
 * Request header that carries the Turnstile token from the client to a guarded API.
 * A header keeps the token out of every API body type, and works for GET and POST alike.
 */
export const HeaderName_TurnstileToken = 'x-turnstile-token';

/** Extra expectations for one verification, on top of the module config. */
export type TurnstileVerifyContext = {
	/** The widget `action` the token must have been issued for. */
	expectedAction?: string;
	/** Hostnames the widget must have been solved on. Overrides the config list for this call. */
	expectedHostnames?: string[];
	/** Sent as siteverify `idempotency_key`, so a retried verification of the same token is accepted. Generated when absent. */
	idempotencyKey?: string;
};
