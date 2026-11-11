import {defineConfig, devices} from '@playwright/test';
import {resolve} from 'path';
import {fileURLToPath} from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const vitePort = '5174';

export default defineConfig({
	testDir: './src/test/app-tools',
	testMatch: '**/*.test.playwright.ts',
	fullyParallel: false,
	workers: 1,
	outputDir: '/tmp/app-tools-playwright',

	webServer: {
		command: `APP_TOOLS_SHELL=1 npx vite --config ${resolve(__dirname, 'vite.config.ts')} --port ${vitePort} --host 127.0.0.1`,
		url: `http://127.0.0.1:${vitePort}/src/test/index.html`,
		reuseExistingServer: false,
		timeout: 60000,
		stdout: 'pipe',
		stderr: 'pipe',
	},

	use: {
		baseURL: `http://127.0.0.1:${vitePort}`,
		headless: true,
		viewport: {width: 1280, height: 900},
		screenshot: 'off',
		video: 'off',
		trace: 'off',
	},

	projects: [
		{name: 'chromium', use: {...devices['Desktop Chromium']}},
	],

	timeout: 60000,
	expect: {timeout: 20000},
});
