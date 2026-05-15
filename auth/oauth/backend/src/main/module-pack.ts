/*
 * @nu-art/oauth-backend - OAuth 2.1 Authorization Server for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {Module} from '@nu-art/ts-common';
import {ModuleBE_OAuthServer} from './modules/ModuleBE_OAuthServer.js';

export const ModulePackBE_OAuth: Module[] = [
	ModuleBE_OAuthServer,
];
