import {defineConfig, devices} from '@playwright/test';
import {resolve} from 'path';
import {fileURLToPath} from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const vitePort = process.env.VITE_PORT ?? '5173';

export default defineConfig({
	testDir: './src/test',
	testMatch: '**/*.test.playwright.ts',

	webServer: {
		command: `npx vite --config ${resolve(__dirname, 'vite.config.ts')} --port ${vitePort} --host 127.0.0.1`,
		url: `http://127.0.0.1:${vitePort}/src/test/index.html`,
		reuseExistingServer: true,
		timeout: 60000,
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
