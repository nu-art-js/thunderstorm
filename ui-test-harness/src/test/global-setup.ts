/*
 * @nu-art/ui-test-harness - Playwright global setup: builds the self-contained IIFE artifact so the
 * self-test can inject the REAL shippable bundle (not a tsc stand-in) via page.addInitScript.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {build} from 'vite';
import {resolve} from 'path';
import {fileURLToPath} from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default async function globalSetup(): Promise<void> {
	const configFile = resolve(__dirname, '../../vite.config.ts');
	await build({configFile, logLevel: 'warn'});
}
