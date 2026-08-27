/*
 * @nu-art/ui-test-harness - Playwright config for the fiber-audit self-test.
 * Authored (not BAI-generated) so we can: build the IIFE in globalSetup, and serve the test page
 * via the package-local vite.config.ts (React-aware) instead of the shared thunderstorm config.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {defineConfig, devices} from '@playwright/test';
import {resolve} from 'path';
import {fileURLToPath} from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const vitePort = process.env.VITE_PORT || '5173';

export default defineConfig({
	testDir: './src/test',
	testMatch: '**/*.test.playwright.ts',
	globalSetup: './src/test/global-setup.ts',

	webServer: {
		command: `npx vite --config ${resolve(__dirname, 'vite.config.ts')} --port ${vitePort} --host 127.0.0.1`,
		url: `http://127.0.0.1:${vitePort}/src/test/index.html`,
		reuseExistingServer: true,
		timeout: 120000,
		stdout: 'pipe',
		stderr: 'pipe',
	},

	use: {
		baseURL: `http://127.0.0.1:${vitePort}`,
		headless: true,
		viewport: {width: 1280, height: 720},
	},

	projects: [
		{name: 'chromium', use: {...devices['Desktop Chromium']}}
	],

	timeout: 30000,
});
