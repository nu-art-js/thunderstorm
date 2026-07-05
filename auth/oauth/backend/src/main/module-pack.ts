/*
 * @nu-art/oauth-backend - OAuth 2.1 Authorization Server for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {Module} from '@nu-art/ts-common';
import {ModuleBE_OAuthClientDB} from './modules/ModuleBE_OAuthClientDB.js';
import {ModuleBE_OAuthGrantDB} from './modules/ModuleBE_OAuthGrantDB.js';
import {ModuleBE_OAuthServer} from './modules/ModuleBE_OAuthServer.js';
import {ModuleBE_OAuthSigningKeyDB} from './modules/ModuleBE_OAuthSigningKeyDB.js';
import {ModuleBE_OAuthTokenDB} from './modules/ModuleBE_OAuthTokenDB.js';

export const ModulePackBE_OAuth: Module[] = [
	ModuleBE_OAuthSigningKeyDB,
	ModuleBE_OAuthClientDB,
	ModuleBE_OAuthGrantDB,
	ModuleBE_OAuthTokenDB,
	ModuleBE_OAuthServer,
];
