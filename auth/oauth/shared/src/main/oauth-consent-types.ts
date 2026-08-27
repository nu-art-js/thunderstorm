/*
 * @nu-art/oauth-shared - OAuth consent flow types
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {TS_Object} from '@nu-art/ts-common';

export const OAuthGrantUserId_PendingConsent = 'pending-consent';

export const OAuthTokenKind_OAuthJwt = 'oauth-jwt';
export const OAuthTokenKind_SessionJwt = 'session-jwt';
export type OAuthTokenKind = typeof OAuthTokenKind_OAuthJwt | typeof OAuthTokenKind_SessionJwt;

// The consent payload is entirely app-defined. The OAuth server never reads it — it only
// hands it to the consuming UI and back to the binder. Keep it opaque here so no consumer
// vocabulary leaks into the auth infra.
export type OAuthConsentContext = TS_Object;

export type OAuthCompleteAuthorizationResponse = {
	redirectUri: string;
	code: string;
	state?: string;
};

// Opaque JWT claim bag. Infra general claims and applicative claims are peers — same shape
// the session JWT abstraction already uses. The auth server persists and forwards the bag;
// only the binder (and app session collectors) read keys inside it.
export type OAuthContextMintParams = {
	claims?: TS_Object;
};

// App-owned extension point. Each consuming module registers a binder for the resource(s) it owns;
// the presence of a matching binder is what makes a resource consent-gated + session-JWT backed.
// The auth server knows nothing about what a binder does beyond these three opaque calls.
// `mintSession` returns the session id — the JWT itself is resolved from the session module.
export type OAuthContextBinder = {
	resolveConsentRedirect: (authReqId: string, resource?: string) => string;
	loadConsentContext: (accountId: string, resource?: string) => Promise<OAuthConsentContext>;
	mintSession: (params: OAuthContextMintParams) => Promise<string>;
};

// Predicate a module supplies at registration to claim the (opaque) RFC 8707 resource(s) it governs.
export type OAuthResourceMatcher = (resource: string | undefined) => boolean;
