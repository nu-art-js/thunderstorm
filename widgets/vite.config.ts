import {defineConfig, type Plugin} from 'vite';
import {nodePolyfills} from 'vite-plugin-node-polyfills';
import svgr from 'vite-plugin-svgr';
import {createRequire} from 'module';
import {resolve} from 'path';
import {fileURLToPath} from 'url';
import * as ts from 'typescript';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(import.meta.url);
const shell = process.env.APP_TOOLS_SHELL === '1';
const reactRoot = resolve(__dirname, '../../node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules');

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
	root: __dirname,
	plugins: [
		vitePluginTsDecorators(),
		svgr({
			include: '**/*.svg',
			svgrOptions: {
				exportType: 'named',
				namedExport: 'ReactComponent',
				icon: true,
			},
		}),
		nodePolyfills({
			include: ['crypto', 'buffer', 'process', 'stream', 'util'],
		}),
	],
	resolve: {
		preserveSymlinks: !shell,
		conditions: ['import', 'module', 'browser', 'default'],
		dedupe: ['react', 'react-dom', 'scheduler'],
		alias: {
			scheduler: shell ? resolve(reactRoot, 'scheduler') : resolve(require.resolve('scheduler/package.json'), '..'),
			cookie: resolve(__dirname, '../../node_modules/.pnpm/react-router@7.18.5_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/cookie'),
			'set-cookie-parser': resolve(__dirname, '../../node_modules/.pnpm/react-router@7.18.5_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/set-cookie-parser'),
			...(shell ? {
				react: resolve(reactRoot, 'react'),
				'react-dom/client': resolve(reactRoot, 'react-dom/client'),
				'react-dom/server': resolve(reactRoot, 'react-dom/server.browser.js'),
				'react-dom': resolve(reactRoot, 'react-dom'),
			} : {}),
		},
	},
	server: {
		port: 5173,
		strictPort: true,
		fs: {
			allow: ['.', resolve(__dirname, '..'), resolve(__dirname, '../..')],
			strict: false,
		},
	},
	optimizeDeps: {
		include: [
			'react',
			'react-dom',
			'react/jsx-runtime',
			'scheduler',
			...(shell ? [
				'crypto',
				'vite-plugin-node-polyfills/shims/buffer',
				'vite-plugin-node-polyfills/shims/global',
				'vite-plugin-node-polyfills/shims/process',
			] : []),
		],
	},
});
