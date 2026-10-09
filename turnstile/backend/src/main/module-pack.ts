/*
 * @nu-art/turnstile-backend - Fail-closed Cloudflare Turnstile verification for Thunderstorm APIs
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {Module} from '@nu-art/ts-common';
import {ModuleBE_TurnstileSiteverify} from './external/ModuleBE_TurnstileSiteverify.js';
import {ModuleBE_Turnstile} from './ModuleBE_Turnstile.js';

export const ModulePackBE_Turnstile: Module[] = [
	ModuleBE_TurnstileSiteverify,
	ModuleBE_Turnstile,
];
