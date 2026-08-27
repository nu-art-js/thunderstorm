/*
 * @nu-art/oauth-shared - OAuth 2.1 shared types for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {tsValidateString, tsValidateValue} from '@nu-art/ts-common';
import type {DatabaseDef_OAuthSigningKey} from './types.js';

export const OAuthSigningKey_modifiablePropsValidator: DatabaseDef_OAuthSigningKey['modifiablePropsValidator'] = {
	kid: tsValidateString(),
	alg: tsValidateValue(['RS256', 'ES256'] as const),
	privateJwk: tsValidateString(),
	publicJwk: tsValidateString(),
};

export const OAuthSigningKey_generatedPropsValidator: DatabaseDef_OAuthSigningKey['generatedPropsValidator'] = {};
