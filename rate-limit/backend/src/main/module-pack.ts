/*
 * @nu-art/rate-limit-backend - Sliding-window rate limiting over the Realtime Database with an http 429 middleware
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {Module} from '@nu-art/ts-common';
import {ModuleBE_RateLimit} from './ModuleBE_RateLimit.js';

export const ModulePackBE_RateLimit: Module[] = [
	ModuleBE_RateLimit,
];
