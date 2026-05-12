import {defineConfig, type Plugin} from 'vite';
import {nodePolyfills} from 'vite-plugin-node-polyfills';
import svgr from 'vite-plugin-svgr';
import {createRequire} from 'module';
import {resolve} from 'path';
import {fileURLToPath} from 'url';
import * as ts from 'typescript';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(import.meta.url);

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
			allow: ['.', resolve(__dirname, '..')],
			strict: false,
		},
	},
	optimizeDeps: {
		include: ['react', 'react-dom', 'react/jsx-runtime', 'scheduler'],
	},
});
