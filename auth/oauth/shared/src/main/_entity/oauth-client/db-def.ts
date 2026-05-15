/*
 * @nu-art/oauth-shared - OAuth 2.1 shared types for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Database} from '@nu-art/db-api-shared';
import {DatabaseDef_OAuthClient, OAuthClient_DbKey} from './types.js';
import {OAuthClient_generatedPropsValidator, OAuthClient_modifiablePropsValidator} from './validators.js';

export const DBDef_OAuthClient: Database<DatabaseDef_OAuthClient> = {
	dbKey: OAuthClient_DbKey,
	entityName: 'OAuthClient',
	modifiablePropsValidator: OAuthClient_modifiablePropsValidator,
	generatedPropsValidator: OAuthClient_generatedPropsValidator,
	generatedProps: ['clientSecret'],
	versions: ['1.0.0'],
	uniqueKeys: ['clientId'],
	frontend: {group: 'oauth', name: 'oauth-client'},
	backend: {name: OAuthClient_DbKey},
};
