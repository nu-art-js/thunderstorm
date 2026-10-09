/*
 * @nu-art/turnstile-backend - Fail-closed Cloudflare Turnstile verification for Thunderstorm APIs
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {TurnstileSiteverify_Response} from './external/api-def.js';

export type TurnstileRejectReason =
	| 'token_missing'
	| 'secret_unavailable'
	| 'network_error'
	| 'siteverify_failed'
	| 'hostname_mismatch'
	| 'action_mismatch';

export type TurnstileOutcome =
	| { outcome: 'accepted'; hostname: string; action?: string }
	| { outcome: 'rejected'; reason: TurnstileRejectReason; errorCodes?: string[]; hostname?: string };

export type TurnstileExpectations = {
	/** Lower-cased hostnames; empty means "any hostname". */
	hostnames: string[];
	action?: string;
};

/**
 * Pure evaluation of a siteverify response against the expectations. Fails closed: anything other than
 * `success === true` with matching hostname and action is a rejection.
 */
export function evaluateSiteverify(response: TurnstileSiteverify_Response, expect: TurnstileExpectations): TurnstileOutcome {
	const errorCodes = Array.isArray(response['error-codes']) ? response['error-codes'] : [];
	const hostname = typeof response.hostname === 'string' ? response.hostname.toLowerCase() : '';
	if (response.success !== true)
		return {outcome: 'rejected', reason: 'siteverify_failed', errorCodes};

	if (expect.hostnames.length > 0 && !expect.hostnames.includes(hostname))
		return {outcome: 'rejected', reason: 'hostname_mismatch', hostname};

	if (expect.action !== undefined && response.action !== expect.action)
		return {outcome: 'rejected', reason: 'action_mismatch', hostname};

	return {outcome: 'accepted', hostname, ...(response.action !== undefined ? {action: response.action} : {})};
}
