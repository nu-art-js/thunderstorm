/*
 * @nu-art/oauth-shared - OAuth 2.1 shared types for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {tsValidateArray, tsValidateBoolean, tsValidateExists, tsValidateNumber, tsValidateString, tsValidateValue} from '@nu-art/ts-common';
import type {DatabaseDef_OAuthToken} from './types.js';

export const OAuthToken_modifiablePropsValidator: DatabaseDef_OAuthToken['modifiablePropsValidator'] = {
	clientId: tsValidateString(),
	userId: tsValidateString(),
	scopes: tsValidateArray(tsValidateString()),
	revoked: tsValidateBoolean(),
	tokenType: tsValidateValue(['access', 'refresh'] as const),
	resource: tsValidateString(undefined, false),
	context: tsValidateExists(false),
	tokenKind: tsValidateValue(['oauth-jwt', 'session-jwt'] as const, true),
};

export const OAuthToken_generatedPropsValidator: DatabaseDef_OAuthToken['generatedPropsValidator'] = {
	tokenHash: tsValidateString(),
	expiresAt: tsValidateNumber(),
	issuedAt: tsValidateNumber(),
};
