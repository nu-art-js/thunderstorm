/*
 * Widgets package Vite config for Playwright test pages.
 * Resolves React/scheduler so Vite can bundle when cwd is this package.
 */
import {defineConfig} from 'vite';
import {createRequire} from 'module';
import {resolve} from 'path';
import {fileURLToPath} from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(import.meta.url);

export default defineConfig({
	root: __dirname,
	plugins: [],
	resolve: {
		preserveSymlinks: true,
		conditions: ['import', 'module', 'browser', 'default'],
		dedupe: ['react', 'react-dom', 'scheduler'],
		alias: {
			scheduler: resolve(require.resolve('scheduler/package.json'), '..'),
		},
	},
	server: {
		port: 5173,
		strictPort: true,
		fs: {
			allow: ['.', resolve(__dirname, '../..')],
			strict: false,
		},
	},
	optimizeDeps: {
		include: ['react', 'react-dom', 'react/jsx-runtime', 'scheduler'],
	},
});
