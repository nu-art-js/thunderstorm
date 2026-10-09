/*
 * @nu-art/ts-email-resend-backend - Resend adapter for ts-email
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {Module} from '@nu-art/ts-common';
import {ModuleBE_Email} from '@nu-art/ts-email-backend';
import {ModuleBE_ResendApi} from './external/ModuleBE_ResendApi.js';
import {ResendAdapter} from './ResendAdapter.js';

/**
 * ModuleBE_Email wired to Resend. Use this instead of ModulePackBE_Email (which registers SendGrid);
 * the last adapter to register wins.
 */
export const ModulePackBE_EmailResend: Module[] = [
	ModuleBE_Email,
	ModuleBE_ResendApi,
	ResendAdapter,
];
