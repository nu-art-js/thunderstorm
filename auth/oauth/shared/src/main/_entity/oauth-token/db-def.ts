/*
 * @nu-art/oauth-shared - OAuth 2.1 shared types for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Database} from '@nu-art/db-api-shared';
import {DatabaseDef_OAuthToken, OAuthToken_DbKey} from './types.js';
import {OAuthToken_generatedPropsValidator, OAuthToken_modifiablePropsValidator} from './validators.js';

export const DBDef_OAuthToken: Database<DatabaseDef_OAuthToken> = {
	dbKey: OAuthToken_DbKey,
	entityName: 'OAuthToken',
	modifiablePropsValidator: OAuthToken_modifiablePropsValidator,
	generatedPropsValidator: OAuthToken_generatedPropsValidator,
	generatedProps: ['tokenHash', 'expiresAt', 'issuedAt'],
	versions: ['1.0.0'],
	uniqueKeys: ['tokenHash'],
	frontend: {group: 'oauth', name: 'oauth-token'},
	backend: {name: OAuthToken_DbKey},
};
