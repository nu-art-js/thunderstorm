/*
 * @nu-art/oauth-shared - OAuth 2.1 shared types for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {tsValidateArray, tsValidateBoolean, tsValidateString, tsValidateValue} from '@nu-art/ts-common';
import type {DatabaseDef_OAuthClient} from './types.js';

export const OAuthClient_modifiablePropsValidator: DatabaseDef_OAuthClient['modifiablePropsValidator'] = {
	clientId: tsValidateString(),
	name: tsValidateString(),
	redirectUris: tsValidateArray(tsValidateString()),
	allowedScopes: tsValidateArray(tsValidateString()),
	clientType: tsValidateValue(['public', 'confidential'] as const),
	enabled: tsValidateBoolean(),
};

export const OAuthClient_generatedPropsValidator: DatabaseDef_OAuthClient['generatedPropsValidator'] = {
	clientSecret: tsValidateString(),
};
