/*
 * Thunderstorm - Shared Vite config for Playwright test pages
 * Used by all packages with browser Playwright tests (db-api/frontend, browser/idb/frontend, etc.).
 * Uses TypeScript compiler for transform so Stage 3 decorators (e.g. ApiCaller) are emitted.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {defineConfig, type Plugin} from 'vite';
import {nodePolyfills} from 'vite-plugin-node-polyfills';
import * as ts from 'typescript';
import {fileURLToPath} from 'node:url';

// _thunderstorm root (this file's dir); vite.config is shared by every Playwright test page
const thunderstormRoot = fileURLToPath(new URL('.', import.meta.url));

/**
 * Transform .ts/.tsx with the TypeScript compiler so Stage 3 decorators
 * (e.g. ApiCaller with ClassMethodDecoratorContext) are emitted. Esbuild
 * only supports legacy experimentalDecorators and would not wrap methods correctly.
 */
function vitePluginTsDecorators(): Plugin {
	return {
		name: 'vite-plugin-ts-decorators',
		enforce: 'pre',
		transform(code, id) {
			if (!/\.tsx?$/.test(id))
				return null;
			const compilerOptions: ts.CompilerOptions = {
				module: ts.ModuleKind.ESNext,
				target: ts.ScriptTarget.ES2022,
				moduleResolution: ts.ModuleResolutionKind.NodeNext,
				jsx: ts.JsxEmit.ReactJSX,
				// Do not set experimentalDecorators so TS 5+ uses Stage 3 decorators
				isolatedModules: true,
				allowSyntheticDefaultImports: true,
				esModuleInterop: true,
			};
			const result = ts.transpileModule(code, {
				compilerOptions,
				fileName: id,
			});
			return {
				code: result.outputText,
				map: result.sourceMapText ?? undefined,
			};
		},
	};
}

export default defineConfig({
	// When Playwright runs, cwd is the package dir; serve from there so /src/test/index.html resolves
	root: process.cwd(),
	plugins: [
		vitePluginTsDecorators(),
		nodePolyfills({
			include: ['crypto', 'buffer', 'process', 'stream', 'util'],
		}),
	],
	resolve: {
		preserveSymlinks: true,
		conditions: ['import', 'module', 'browser', 'default'],
		alias: [
			// With preserveSymlinks, transitive linked deps (e.g. http-client -> api-types) are resolved from the
			// importing package's symlink path, where they're not installed. Point them at the built package.
			{find: /^@nu-art\/api-types$/, replacement: `${thunderstormRoot}http/api-types/dist/index.js`},
		],
	},
	server: {
		port: 5173,
		strictPort: true,
		fs: {
			allow: ['.'],
			strict: false,
		},
	},
	optimizeDeps: {
		include: ['node-forge', 'jose', 'moment', 'axios'],
		exclude: [
			'@nu-art/ts-common',
			'@nu-art/idb-shared',
			'@nu-art/idb-frontend',
			'@nu-art/logger',
		],
		force: ['@nu-art/http-client'],
	},
});
