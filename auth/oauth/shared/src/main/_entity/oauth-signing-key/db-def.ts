/*
 * @nu-art/oauth-shared - OAuth 2.1 shared types for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Database} from '@nu-art/db-api-shared';
import {DatabaseDef_OAuthSigningKey, OAuthSigningKey_DbKey} from './types.js';
import {OAuthSigningKey_generatedPropsValidator, OAuthSigningKey_modifiablePropsValidator} from './validators.js';

export const DBDef_OAuthSigningKey: Database<DatabaseDef_OAuthSigningKey> = {
	dbKey: OAuthSigningKey_DbKey,
	entityName: 'OAuthSigningKey',
	modifiablePropsValidator: OAuthSigningKey_modifiablePropsValidator,
	generatedPropsValidator: OAuthSigningKey_generatedPropsValidator,
	versions: ['1.0.0'],
	uniqueKeys: ['kid'],
	frontend: {group: 'oauth', name: 'oauth-signing-key'},
	backend: {name: OAuthSigningKey_DbKey},
};
