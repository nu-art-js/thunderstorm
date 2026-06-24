/*
 * @nu-art/ui-test-harness - Vite config: dev server for the Playwright self-test page AND the
 * self-contained IIFE library build injected via addInitScript.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {nodePolyfills} from 'vite-plugin-node-polyfills';
import {createRequire} from 'module';
import {resolve} from 'path';
import {fileURLToPath} from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(import.meta.url);

export default defineConfig({
	root: __dirname,
	plugins: [
		react(),
		nodePolyfills({include: ['process', 'buffer', 'util']}),
	],
	resolve: {
		preserveSymlinks: true,
		conditions: ['import', 'module', 'browser', 'default'],
		// scheduler is a transitive dep of react-dom; pnpm does not hoist it, so alias + dedupe it explicitly.
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
		include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'scheduler'],
	},
	// `vite build` produces the self-contained IIFE the self-test injects (built in Playwright globalSetup).
	// Emitted to dist-iife/ so it never collides with the tsc lib output in dist/.
	build: {
		lib: {
			entry: resolve(__dirname, 'src/main/iife.ts'),
			formats: ['iife'],
			name: 'UITestHarness',
			fileName: () => 'harness.iife.js',
		},
		outDir: 'dist-iife',
		emptyOutDir: true,
		minify: false,
		target: 'es2020',
		rollupOptions: {external: []},
	},
});
