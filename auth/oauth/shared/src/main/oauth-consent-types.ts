/*
 * @nu-art/oauth-shared - OAuth consent flow types
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {UniqueId} from '@nu-art/ts-common';

export const OAuthGrantUserId_PendingConsent = 'pending-consent';

export const OAuthTokenKind_OAuthJwt = 'oauth-jwt';
export const OAuthTokenKind_SessionJwt = 'session-jwt';
export type OAuthTokenKind = typeof OAuthTokenKind_OAuthJwt | typeof OAuthTokenKind_SessionJwt;

export type OAuthConsentOrgUnitOption = {
	_id: UniqueId;
	label: string;
	organizationId: UniqueId;
	organizationLabel: string;
	organizationDomain: string;
};

export type OAuthConsentProjectOption = {
	_id: UniqueId;
	name: string;
	organizationId: UniqueId;
};

export type OAuthConsentContext = {
	orgUnits: OAuthConsentOrgUnitOption[];
	projects: OAuthConsentProjectOption[];
};

export type OAuthCompleteAuthorizationResponse = {
	redirectUri: string;
	code: string;
	state?: string;
};

export type OAuthContextMintParams = {
	accountId: string;
	deviceId: string;
	orgUnitId: UniqueId;
	projectId: UniqueId;
	label: string;
};

export type OAuthContextBinder = {
	loadConsentContext: (accountId: string) => Promise<OAuthConsentContext>;
	mintSessionJwt: (params: OAuthContextMintParams) => Promise<string>;
	resolveConsentRedirect: (authReqId: string, org?: string) => string;
};
