import {createRequire} from 'module';
import {readdirSync} from 'fs';
import {defineConfig} from 'vite';
import {resolve} from 'path';
import {fileURLToPath} from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(__dirname, '../../..');
const reactRoot = resolve(repoRoot, 'node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules');
const pnpm = resolve(repoRoot, 'node_modules/.pnpm');
const polyfillDir = readdirSync(pnpm).find(name => name.startsWith('vite-plugin-node-polyfills@'));
if (!polyfillDir)
	throw new Error('vite-plugin-node-polyfills is not installed');

const require = createRequire(resolve(pnpm, polyfillDir, 'node_modules/vite-plugin-node-polyfills/package.json'));
const {nodePolyfills} = require('vite-plugin-node-polyfills') as {nodePolyfills: (options: {include: string[]}) => unknown};

export default defineConfig({
	root: __dirname,
	plugins: [
		nodePolyfills({
			include: ['crypto', 'buffer', 'process', 'stream', 'util'],
		}),
	],
	resolve: {
		preserveSymlinks: false,
		dedupe: ['react', 'react-dom', 'scheduler'],
		alias: {
			react: resolve(reactRoot, 'react'),
			'react-dom/client': resolve(reactRoot, 'react-dom/client'),
			'react-dom': resolve(reactRoot, 'react-dom'),
			scheduler: resolve(reactRoot, 'scheduler'),
		},
	},
	server: {
		port: 5191,
		strictPort: true,
		fs: {
			allow: [repoRoot],
			strict: false,
		},
	},
	optimizeDeps: {
		include: ['react', 'react-dom', 'react/jsx-runtime', 'scheduler'],
	},
});
