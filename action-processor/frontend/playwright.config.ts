import {defineConfig, devices} from '@playwright/test';
import {resolve} from 'path';
import {fileURLToPath} from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(__dirname, '../../..');
const vitePort = process.env.VITE_PORT ?? '5191';
const sassPath = resolve(repoRoot, 'node_modules/.pnpm/sass@1.108.1/node_modules');

export default defineConfig({
	testDir: './src/test',
	testMatch: '**/*.test.playwright.ts',
	fullyParallel: false,
	workers: 1,
	outputDir: '/tmp/dev-tools-playwright',

	webServer: {
		command: `NODE_PATH="${sassPath}" npx vite --config ${resolve(__dirname, 'vite.config.ts')} --port ${vitePort} --host 127.0.0.1`,
		url: `http://127.0.0.1:${vitePort}/src/test/dev-tools/index.html`,
		reuseExistingServer: true,
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

	timeout: 30000,
});
