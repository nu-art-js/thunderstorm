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

export type OAuthContextMintParams = {
	accountId: string;
	deviceId: string;
	label: string;
	// Opaque, app-defined selection captured at consent time (e.g. the payload posted by the
	// consuming consent UI). The auth server persists and forwards it; only the binder reads it.
	context?: TS_Object;
};

// App-owned extension point. Each consuming module registers a binder for the resource(s) it owns;
// the presence of a matching binder is what makes a resource consent-gated + session-JWT backed.
// The auth server knows nothing about what a binder does beyond these three opaque calls.
export type OAuthContextBinder = {
	resolveConsentRedirect: (authReqId: string, resource?: string) => string;
	loadConsentContext: (accountId: string, resource?: string) => Promise<OAuthConsentContext>;
	mintSessionJwt: (params: OAuthContextMintParams) => Promise<string>;
};

// Predicate a module supplies at registration to claim the (opaque) RFC 8707 resource(s) it governs.
export type OAuthResourceMatcher = (resource: string | undefined) => boolean;
