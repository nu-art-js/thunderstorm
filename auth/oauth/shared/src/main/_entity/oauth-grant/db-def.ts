/*
 * @nu-art/oauth-shared - OAuth 2.1 shared types for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Database} from '@nu-art/db-api-shared';
import {DatabaseDef_OAuthGrant, OAuthGrant_DbKey} from './types.js';
import {OAuthGrant_generatedPropsValidator, OAuthGrant_modifiablePropsValidator} from './validators.js';

export const DBDef_OAuthGrant: Database<DatabaseDef_OAuthGrant> = {
	dbKey: OAuthGrant_DbKey,
	entityName: 'OAuthGrant',
	modifiablePropsValidator: OAuthGrant_modifiablePropsValidator,
	generatedPropsValidator: OAuthGrant_generatedPropsValidator,
	generatedProps: ['authorizationCode', 'expiresAt'],
	versions: ['1.0.0'],
	uniqueKeys: ['authorizationCode'],
	frontend: {group: 'oauth', name: 'oauth-grant'},
	backend: {name: OAuthGrant_DbKey},
};
