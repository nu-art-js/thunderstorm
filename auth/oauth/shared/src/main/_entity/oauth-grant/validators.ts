/*
 * @nu-art/oauth-shared - OAuth 2.1 shared types for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {tsValidateArray, tsValidateBoolean, tsValidateNumber, tsValidateString, tsValidateValue} from '@nu-art/ts-common';
import type {DatabaseDef_OAuthGrant} from './types.js';

export const OAuthGrant_modifiablePropsValidator: DatabaseDef_OAuthGrant['modifiablePropsValidator'] = {
	clientId: tsValidateString(),
	userId: tsValidateString(),
	scopes: tsValidateArray(tsValidateString()),
	codeChallenge: tsValidateString(),
	codeChallengeMethod: tsValidateValue(['S256'] as const),
	redirectUri: tsValidateString(),
	used: tsValidateBoolean(),
	resource: tsValidateString(undefined, false),
	oauthState: tsValidateString(undefined, false),
	orgUnitId: tsValidateString(undefined, false),
	projectId: tsValidateString(undefined, false),
	sessionJwt: tsValidateString(undefined, false),
	tokenKind: tsValidateValue(['oauth-jwt', 'session-jwt'] as const, true),
};

export const OAuthGrant_generatedPropsValidator: DatabaseDef_OAuthGrant['generatedPropsValidator'] = {
	authorizationCode: tsValidateString(),
	expiresAt: tsValidateNumber(),
};
