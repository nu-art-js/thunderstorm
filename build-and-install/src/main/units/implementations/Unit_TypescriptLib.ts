import * as fs from 'fs';
import {copyFileSync, existsSync, promises as _fs, readdirSync, statSync} from 'fs';
import {
	__stringify,
	arrayToMap,
	BadImplementationException,
	ImplementationMissingException,
	LogLevel,
	merge,
	NotImplementedYetException,
	RecursivePartial,
	TypedMap
} from '@nu-art/ts-common';
import {UnitPhaseImplementor} from '../../core/types.js';
import {CONST_BaiConfig, CONST_FirebaseJSON, CONST_FirebaseRC, CONST_PackageJSON, CONST_PackageJSONTemplate, CONST_TS_CONFIG} from '../../config/consts.js';
import {Commando_Basic, Commando_NVM, CommandoException} from '@nu-art/commando';
import {resolve, resolve as pathResolve} from 'path';
import {Unit_PackageJson, Unit_PackageJson_Config} from './Unit_PackageJson.js';
import {
	Phase_CheckCyclicImports,
	Phase_Compile,
	Phase_ExtractDynamicDeps,
	Phase_Lint,
	Phase_MapExports,
	Phase_PreCompile,
	Phase_PrintDependencyTree,
	Phase_Publish,
	Phase_Test,
	Phase_ToESM
} from '../../phases/definitions/consts.js';
import {ProjectUnit_RuntimeContext} from '../base/ProjectUnit.js';
import {glob} from 'node:fs/promises';
import {TestType, TestTypes} from '../../core/params.js';
import {DEFAULT_TEMPLATE_PATTERN, FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';
import path from 'node:path';
import {ExportMapper} from '../../exports/ExportMapper.js';
import {TsConfig} from '../base/types.js';


export type Unit_TypescriptLib_Config = Unit_PackageJson_Config & {
	customESLintConfig: boolean;
	customTSConfig: boolean;
	hasSelfHotReload: boolean
	output: string;
};

const assets = [
	'*.json',
	'*.scss',
	'*.svg',
	'*.png',
	'*.jpg',
	'*.jpeg',
	'*.rules',
	'*._ts',
	'*.gif',
	'*.csv',
	'*.yaml',
	'dockerfile',
];


const defaultTestPatterns: Record<TestType, string> = {
	pure: '**/*.test.ts',
	firebase: '**/*.test.firebase.ts',
	ui: '**/*.test.ui.ts',
	mobile: '**/*.test.mobile.ts',
	playwright: '**/*.test.playwright.ts'
};
const CONST_ESM_PREFIX = 'export NODE_OPTIONS=\'--import data:text/javascript,import%20%7B%20register%20%7D%20from%20%22node%3Amodule%22%3B%20import%20%7B%20pathToFileURL%20%7D%20from%20%22node%3Aurl%22%3B%20register%28%22ts-node%2Fesm%22%2C%20pathToFileURL%28%22.%2F%22%29%29%3B\'';
const TestsCommandComposer: Record<TestType, (config: Unit_TypescriptLib_Config, runtimeContext: ProjectUnit_RuntimeContext) => Promise<string>> = {
	pure: async (config, runtimeContext) => {
		const command = resolve(runtimeContext.parentUnit.config.fullPath, 'node_modules/.bin/ts-mocha');
		const files = runtimeContext.runtimeParams.testFiles ?? [`src/test/${defaultTestPatterns.pure}`].map(file => `'${file}'`);
		const testCases = runtimeContext.runtimeParams.testCases;
		const cli_testFiles = ` ${files.join(' ')}`;
		const cli_testCases = testCases ? ` --grep '${testCases.join('|')}'` : '';
		const cli_watchFiles = files.map(file => `-watch-files ${file}`).join(' ');

		const debugPort = runtimeContext.runtimeParams.testDebugPort;
		const cli_debug = debugPort ? ` --inspect=${debugPort} -w ${cli_watchFiles}` : '';

		return `${CONST_ESM_PREFIX} && ${command} -p src/test/${CONST_TS_CONFIG} --timeout 0 ${cli_debug}${cli_testFiles}${cli_testCases}`;
	},
	firebase: async (config, runtimeContext) => {
		const command = resolve(runtimeContext.parentUnit.config.fullPath, 'node_modules/.bin/ts-mocha');
		const files = runtimeContext.runtimeParams.testFiles ?? [`src/test/${defaultTestPatterns.firebase}`].map(file => `'${file}'`);
		const testCases = runtimeContext.runtimeParams.testCases;
		const cli_testFiles = ` ${files.join(' ')}`;
		const cli_testCases = testCases ? ` --grep '${testCases.join('|')}'` : '';
		const cli_watchFiles = files.map(file => `-watch-files ${file}`).join(' ');

		const debugPort = runtimeContext.runtimeParams.testDebugPort;
		const cli_debug = debugPort ? ` --inspect=${debugPort} -w ${cli_watchFiles}` : '';

		// const pah = 'ts-mocha  --timeout 0 --inspect=8107 --watch-files \'src/test/**/*.test.ts\' src/test/**/*.test.ts';

		const functionContextCommand = `${CONST_ESM_PREFIX} && ${command} -p src/test/${CONST_TS_CONFIG} --timeout 0 ${cli_debug}${cli_testFiles}${cli_testCases}`;
		return `firebase emulators:exec "${functionContextCommand}"`;
	},
	ui: async () => {
		throw new NotImplementedYetException('UI tests not implemented yet');
	},
	mobile: async () => {
		throw new NotImplementedYetException('Mobile tests not implemented yet');
	},
	playwright: async (config, runtimeContext) => {
		const command = resolve(runtimeContext.parentUnit.config.fullPath, 'node_modules/.bin/playwright');

		// Playwright accepts file paths as arguments (not glob patterns)
		// If testFiles not explicitly provided, discover them via glob and convert to relative paths
		let testFiles = runtimeContext.runtimeParams.testFiles;
		if (!testFiles) {
			const pattern = resolve(config.fullPath, 'src/test', defaultTestPatterns.playwright);
			const fileIterator = glob(pattern, {});
			const absoluteFiles = [];
			for await (const file of fileIterator)
				absoluteFiles.push(file);

			testFiles = absoluteFiles.map(file => path.relative(config.fullPath, file));
		}

		const cli_testFiles = testFiles.length > 0 ? ` ${testFiles.join(' ')}` : '';

		// Map test cases to Playwright's --grep option
		const testCases = runtimeContext.runtimeParams.testCases;
		const cli_testCases = testCases ? ` --grep '${testCases.join('|')}'` : '';

		// Map debug port to Playwright's --debug option
		const debugPort = runtimeContext.runtimeParams.testDebugPort;
		const cli_debug = debugPort ? ` --debug=${debugPort}` : '';

		return `${command} test${cli_testFiles}${cli_testCases}${cli_debug}`;
	},
};

/**
 * TypeScript library unit for building TypeScript packages.
 *
 * **Key Responsibilities**:
 * - Compiles TypeScript to JavaScript
 * - Runs tests (pure, firebase, ui, mobile, playwright)
 * - Lints code
 * - Publishes packages
 * - Manages assets (JSON, SCSS, SVG, images)
 * - Handles ESM conversion
 *
 * **Phases Implemented**:
 * - `preCompile()`: Prepares compilation (creates output dir, clears if needed)
 * - `compile()`: Compiles TypeScript using tsc
 * - `watchCompile()`: Incremental compilation for watch mode
 * - `runTests()`: Runs tests based on test type
 * - `lint()`: Lints code using ESLint
 * - `publish()`: Publishes package to registry
 * - `convertToESM()`: Converts package to ESM format
 * - `printDependencyTree()`: Prints dependency tree
 * - `checkCyclicImports()`: Checks for circular imports
 *
 * **Test Types**:
 * - **pure**: Standard TypeScript tests (ts-mocha)
 * - **firebase**: Tests with Firebase emulators
 * - **ui**: UI tests (not implemented)
 * - **mobile**: Mobile tests (not implemented)
 * - **playwright**: Playwright test runner (@playwright/test)
 *   - Automatic browser instance management (one per worker)
 *   - Better performance with shared browser instances across test files
 *   - Built-in fixtures and test isolation
 *   - Pattern: **\/*.test.playwright.ts
 *
 * **Asset Management**: Automatically copies non-TypeScript files (JSON, SCSS, SVG, images)
 * to output directory during compilation.
 *
 * **Dependency Resolution**: Resolves transitive dependencies for compilation order.
 */
export class Unit_TypescriptLib<C extends Unit_TypescriptLib_Config = Unit_TypescriptLib_Config>
	extends Unit_PackageJson<C>
	implements UnitPhaseImplementor<[Phase_PreCompile, Phase_Compile, Phase_PrintDependencyTree, Phase_CheckCyclicImports, Phase_Lint, Phase_Test, Phase_Publish, Phase_ToESM, Phase_ExtractDynamicDeps, Phase_MapExports]> {

	private TestTypeWorkspaceSetup: Record<TestType, (config: Unit_TypescriptLib_Config, runtimeContext: ProjectUnit_RuntimeContext) => Promise<void>> = {
		pure: async (config, runtimeContext) => {
		},
		firebase: async (config, runtimeContext) => {
			const pathToTestsFirebaseJson = runtimeContext.baiConfig.files?.tests?.firebase?.[CONST_FirebaseJSON];
			if (!pathToTestsFirebaseJson)
				throw new ImplementationMissingException('Missing default firebase.json file in tests.firebase');

			const pathToTestsFirebaseRC = runtimeContext.baiConfig.files?.tests?.firebase?.[CONST_FirebaseRC];
			if (!pathToTestsFirebaseRC)
				throw new ImplementationMissingException('Missing default .firebaserc file in tests.firebase');

			const pathToProjectRoot = runtimeContext.parentUnit.config.fullPath;
			await FileSystemUtils.file.copy(resolve(pathToProjectRoot, pathToTestsFirebaseRC), resolve(config.fullPath, CONST_FirebaseRC));
			const ports = [
				`${(runtimeContext.baiConfig.files?.tests?.firebase?.baseEmulationPort ?? 8000) + 1}`,
				`${(runtimeContext.baiConfig.files?.tests?.firebase?.baseEmulationPort ?? 8000) + 2}`,
				`${(runtimeContext.baiConfig.files?.tests?.firebase?.baseEmulationPort ?? 8000) + 3}`
			];

			if (runtimeContext.runtimeParams.testDebugPort)
				ports.push(`${runtimeContext.runtimeParams.testDebugPort}`);


			const firebaseConfigFiles = runtimeContext.baiConfig.files?.firebase;
			if (!firebaseConfigFiles)
				throw new ImplementationMissingException(`Missing firebase config files in ${CONST_BaiConfig}`);

			await FileSystemUtils.file.template.copy(resolve(pathToProjectRoot, pathToTestsFirebaseJson), resolve(config.fullPath, CONST_FirebaseJSON), {
				FIREBASE_RTDB_PORT: ports[0],
				FIRESTORE_PORT: ports[1],
				FIRESTORE_WEBSOCKET_PORT: ports[2],
				FIREBASE_DATABASE_RULES: resolve(pathToProjectRoot, firebaseConfigFiles.databaseRules!),
				FIREBASE_FIRESTORE_RULES: resolve(pathToProjectRoot, firebaseConfigFiles.firestoreRules!),
				FIREBASE_FIRESTORE_INDICES: resolve(pathToProjectRoot, firebaseConfigFiles.firestoreIndexesRules!),
			}, DEFAULT_TEMPLATE_PATTERN);

			await this.releasePorts(ports);

			const mongoPort = runtimeContext.baiConfig.files?.tests?.firebase?.mongoPort;
			if (mongoPort) {
				const containerName = `mongo-test-${config.key.replace(/[^a-z0-9-]/gi, '-')}`;
				this.logInfo(`Starting MongoDB test container on port ${mongoPort} (container: ${containerName})`);

				const rmCommando = this.allocateCommando();
				await this.executeAsyncCommando(rmCommando, `docker rm -f ${containerName} 2>/dev/null || true`, () => {});
				await this.releasePorts([`${mongoPort}`]);
				const commando = this.allocateCommando();
				await this.executeAsyncCommando(commando, `docker run -d --name ${containerName} -p ${mongoPort}:${mongoPort} mongo:7 --replSet rs0 --port ${mongoPort}`, (stdout, stderr, exitCode) => {
					if (exitCode !== 0)
						throw new CommandoException('Failed to start MongoDB test container', stdout, stderr, exitCode);
				});

				const initCommando = this.allocateCommando();
				await this.executeAsyncCommando(initCommando, `sleep 3 && docker exec ${containerName} mongosh --port ${mongoPort} --quiet --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:${mongoPort}'}]}); while(!rs.status().members.some(m=>m.stateStr==='PRIMARY')){sleep(200)} print('PRIMARY ready')"`, (stdout, stderr, exitCode) => {
					if (exitCode !== 0)
						throw new CommandoException('Failed to initiate MongoDB test replica set', stdout, stderr, exitCode);
				});

				this.logInfo(`MongoDB test container started as replica set on port ${mongoPort}`);

				this.registerTerminatable(async () => {
					try {
						const stopCommando = this.allocateCommando();
						await this.executeAsyncCommando(stopCommando, `docker rm -f ${containerName}`, () => {
						});
					} catch (e: any) {
						this.logWarning(`Failed to stop MongoDB test container: ${e.message}`);
					}
				});
			}
		},
		ui: async () => {
			throw new NotImplementedYetException('UI tests not implemented yet');
		},
		mobile: async () => {
			throw new NotImplementedYetException('Mobile tests not implemented yet');
		},
		playwright: async (config, runtimeContext) => {
			const playwrightConfigPath = resolve(config.fullPath, 'playwright.config.ts');

			// Generate playwright.config.ts if missing
			if (!await FileSystemUtils.file.exists(playwrightConfigPath)) {
				const playwrightConfig = runtimeContext.baiConfig.files?.tests?.playwright;
				const browsers = playwrightConfig?.browsers ?? ['chromium'];
				const headless = playwrightConfig?.headless ?? true;
				const baseURL = playwrightConfig?.baseURL;
				const viewport = playwrightConfig?.viewport ?? {width: 1280, height: 720};

				// Vite config: from bai-config, or default to shared _thunderstorm/vite.config.ts when package is under _thunderstorm
				const projectRoot = runtimeContext.parentUnit.config.fullPath;
				const viteConfigPathFromConfig = playwrightConfig?.vite?.configPath;
				const defaultThunderstormVitePath = '_thunderstorm/vite.config.ts';
				const viteConfigPath = viteConfigPathFromConfig ?? (config.fullPath.includes('_thunderstorm') ? defaultThunderstormVitePath : undefined);
				const vitePort = playwrightConfig?.vite?.port ?? 5173;
				const viteOptions = viteConfigPath ? {
					port: vitePort,
					configPath: path.relative(config.fullPath, resolve(projectRoot, viteConfigPath))
				} : undefined;

				const configContent = this.generatePlaywrightConfig({
					browsers,
					headless,
					baseURL,
					viewport,
					vite: viteOptions
				});

				await FileSystemUtils.file.write(playwrightConfigPath, configContent);
				this.logInfo(`Generated playwright.config.ts for ${config.key}`);
			}

			// Ensure browser binaries are installed
			const commando = this.allocateCommando(Commando_NVM)
				.cd(config.fullPath);

			const playwrightConfig = runtimeContext.baiConfig.files?.tests?.playwright;
			const browsersToInstall = playwrightConfig?.browsers ?? ['chromium'];

			for (const browser of browsersToInstall) {
				await this.executeAsyncCommando(
					commando,
					`npx playwright install ${browser}`,
					(stdout, stderr, exitCode) => {
						if (exitCode !== 0) {
							this.logWarning(`Failed to install ${browser} browser, tests may fail`);
						}
					}
				);
			}
		},
	};

	async runTests() {
		const testsFolder = resolve(this.config.fullPath, 'src/test');
		if (!await FileSystemUtils.file.exists(testsFolder))
			return this.logWarning('NO TESTS FOR PACKAGE!');

		const testTypes = this.runtimeContext.runtimeParams.testType;

		for (const testType of TestTypes) {
			if (testTypes?.length && !testTypes.includes(testType)) {
				this.logVerbose(`Test type (${testType}) not selected, skipping`);
				continue;
			}

			const pattern = `${resolve(testsFolder, defaultTestPatterns[testType])}`;
			const fileIterator = glob(pattern, {});
			const files = [];
			for await (const file of fileIterator)
				files.push(file);

			if (files.length === 0) {
				this.logDebug(`No tests found for test type: ${testType} using pattern: ${pattern}`);
				continue;
			}

			await this.TestTypeWorkspaceSetup[testType](this.config, this.runtimeContext);
			const commando = this.allocateCommando(Commando_NVM)
				.cd(this.config.fullPath);

			const testCommand = await TestsCommandComposer[testType](this.config, this.runtimeContext);

			await this.executeAsyncCommando(commando, testCommand, (stdout, stderr, exitCode) => {
				if (exitCode !== 0)
					throw new CommandoException(`Error running tests`, stdout, stderr, exitCode);
			});
		}
	}

	private generatePlaywrightConfig(options: {
		browsers: string[];
		headless: boolean;
		baseURL?: string;
		viewport: { width: number; height: number };
		vite?: {
			port: number;
			configPath: string; // Relative path from package to vite config
		};
	}): string {
		const browserNames = options.browsers.map(browser => {
			const deviceName = browser === 'webkit' ? 'Safari' : browser.charAt(0).toUpperCase() + browser.slice(1);
			return `    {
      name: '${browser}',
      use: { ...devices['Desktop ${deviceName}'] },
    }`;
		}).join(',\n');

		// Build webServer block if vite config is provided
		const viteConfig = options.vite;
		const webServerBlock = viteConfig ? `
  webServer: {
    command: \`npx vite --config \${resolve(__dirname, '${viteConfig.configPath}')} --port \${vitePort} --host 127.0.0.1\`,
    url: \`http://127.0.0.1:\${vitePort}/src/test/index.html\`,
    reuseExistingServer: true,
    timeout: 60000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
` : '';

		// Use vite URL as baseURL when vite is configured, otherwise use provided baseURL
		const baseURL = viteConfig
			? '`http://127.0.0.1:${vitePort}`'
			: options.baseURL ? `'${options.baseURL}'` : undefined;
		const baseURLConfig = baseURL ? `    baseURL: ${baseURL},` : '';

		// Add imports based on whether vite is used
		const imports = viteConfig
			? `import {defineConfig, devices} from '@playwright/test';
import {resolve} from 'path';
import {fileURLToPath} from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const vitePort = process.env.VITE_PORT || '${viteConfig.port}';
`
			: `import {defineConfig, devices} from '@playwright/test';
`;

		return `${imports}
export default defineConfig({
  testDir: './src/test',
  testMatch: '**/*.test.playwright.ts',
${webServerBlock}
  use: {
    headless: ${options.headless},
${baseURLConfig ? baseURLConfig + '\n' : ''}    viewport: { width: ${options.viewport.width}, height: ${options.viewport.height} },
  },

  projects: [
${browserNames}
  ],

  timeout: 30000,
});
`;
	}

	protected dependencyUnits!: Unit_TypescriptLib[];

	constructor(config: Unit_TypescriptLib<C>['config']) {
		super(config);
		this.addToClassStack(Unit_TypescriptLib);
	}

	//######################### Internal Logic #########################

	protected async clearOutputDir() {
		if (!this.runtimeContext.runtimeParams.clean)
			return;

		await this.clearOutputDirImpl();
	}

	protected async clearOutputDirImpl() {
		await FileSystemUtils.folder.empty(this.config.output, false);
		await FileSystemUtils.folder.create(this.config.output);
	}

	public async prepare(): Promise<void> {
		await super.prepare();
		await this.sharedPrepare();
	}

	public async watchPrepare(): Promise<void> {
		await super.watchPrepare();
		await this.sharedPrepare();
	}

	private async sharedPrepare() {
		await FileSystemUtils.folder.create(this.config.output);
		if (this.config.packageJson.private) {
			// @ts-ignore
			this.publish = undefined;
		}
		const unitKeys = this.runtimeContext.unitsMapper.getTransitiveDependencies([this.config.key]);
		this.dependencyUnits = this.runtimeContext.unitsResolver<Unit_TypescriptLib>(unitKeys, Unit_TypescriptLib);
	}

	protected async compileImpl() {
		const pathToCompile = `${this.config.fullPath}/src/main`;
		const pathToTSConfig = `${pathToCompile}/${CONST_TS_CONFIG}`;

		const commando = this.allocateCommando(Commando_NVM, Commando_Basic)
			.cd(this.config.fullPath)
			.setLogLevelFilter((log, std) => {
				return LogLevel.Error;
			})
			.addLogProcessor((log) => !log.includes('Now using node') && !log.includes('.nvmrc\' with version'));

		await this.executeAsyncCommando(commando, `${this.npmCommand('tsc')} -p "${pathToTSConfig}" --rootDir "${pathToCompile}" --outDir "${this.config.output}"`,
			(stdout, stderr, exitCode) => {
				if (stderr.length)
					this.logError(stderr);

				if (exitCode > 0)
					throw new CommandoException(`Error compiling`, stdout, stderr, exitCode);
			});
	}

	protected async copyAssetsToOutput() {
		const command = `find . \\( -name ${assets.map(pattern => `'${pattern}'`)
			.join(' -o -name ')} \\) | cpio -pdmuv "${this.config.output}" > /dev/null 2>&1`;
		await this.allocateCommando(Commando_Basic)
			.cd(`${this.config.fullPath}/src/main`)
			// .setStdErrorValidator(stderr => {
			// 	return !stderr.match(/\d+\sblock/);
			// })
			.append(command)
			.execute();

		await FileSystemUtils.file.delete(resolve(this.config.output, CONST_TS_CONFIG));
	}


	public ignoreWatchFiles() {
		return [`${this.config.fullPath}/.*?/${CONST_TS_CONFIG}`];
	}

	/**
	 * Watch compile actions, use this to perform all necessary compile actions for watch.
	 * watch compile is a subset of the general watch action
	 */
	public async watchCompile() {
		await this.compileImpl();
		await this.copyAssetsToOutput();
		await this.copyPackageJSONToOutput();
	}

	/**
	 * Remove the deleted file/folder from the dist folder on watch remove file event
	 * @param path The path of the currently removed file/folder
	 * @private
	 */
	public async removeSpecificFileFromDist(path: string) {
		this.setStatus('Removing files from dist', 'start');
		const distPathBase = path.replace('src/main', 'dist').replace(/\.ts$/, '');
		const pathsToDelete = [
			`${distPathBase}.js`,
			`${distPathBase}.d.ts`,
			`${distPathBase}.js.map`,
			distPathBase // in case it's a directory
		];

		// try to remove all path options from dist
		for (const path of pathsToDelete) {
			if (!fs.existsSync(path)) {
				this.logDebug(`no file in path ${path}`);
				continue;
			}

			await _fs.rm(path, {recursive: true, force: true});
		}
		this.setStatus('Files Removed and watching', 'end');
	}

	//######################### Phase Implementations #########################

	public async preCompile() {
		const srcFolder = pathResolve(this.config.fullPath, 'src');
		const entries = readdirSync(srcFolder);
		for (const entry of entries) {
			await this.resolveTSConfig(srcFolder, entry);
		}

		if (!fs.existsSync(`${this.config.fullPath}/prebuild.sh`))
			return;

		await this.allocateCommando(Commando_Basic)
			.cd(this.config.fullPath)
			.append('bash prebuild.sh')
			.execute();
	}

	public async extractDynamicDeps() {
		this.setStatus('Extracting dynamic dependencies', 'start');

		// Get all workspace package names from parent unit's child units
		const workspacePackageNames = new Set<string>();
		for (const unit of this.runtimeContext.childUnits) {
			workspacePackageNames.add(unit.config.key);
		}

		// Find all TypeScript files in src/main and src/test
		const srcMainTs = `${this.config.fullPath}/src/main/**/*.ts`;
		const srcMainTsx = `${this.config.fullPath}/src/main/**/*.tsx`;

		const allFiles: string[] = [];
		for await (const file of glob(srcMainTs, {}))
			allFiles.push(file);
		for await (const file of glob(srcMainTsx, {}))
			allFiles.push(file);

		// Regex patterns for ESM imports
		const importFromRegex = /from\s+["']([^"']+)["']/g;
		const dynamicImportRegex = /import\(["']([^"']+)["']\)/g;

		const workspacePackages = new Set<string>();
		const externalPackages = new Set<string>();

		// Helper function to process import matches
		const processImportMatches = (regex: RegExp, content: string) => {
			let match;
			while ((match = regex.exec(content)) !== null) {
				const importPath = match[1];
				const packageName = this.extractPackageName(importPath);
				if (packageName) {
					if (workspacePackageNames.has(packageName)) {
						workspacePackages.add(packageName);
					} else {
						externalPackages.add(packageName);
					}
				}
			}
			regex.lastIndex = 0;
		};

		// Process each file
		for (const filePath of allFiles) {
			const content = await FileSystemUtils.file.read(filePath);

			// Extract imports from "import ... from 'package'" and dynamic import('package')
			processImportMatches(importFromRegex, content);
			processImportMatches(dynamicImportRegex, content);
		}

		// Sort and convert to arrays
		const workspaceArray = Array.from(workspacePackages).sort();
		const externalArray = Array.from(externalPackages).sort();

		// Write to _dynamic-deps.json
		const outputPath = pathResolve(this.config.fullPath, '_dynamic-deps.json');
		const output = {
			workspace: workspaceArray,
			external: externalArray
		};

		await FileSystemUtils.file.write(outputPath, __stringify(output, true));
		this.logInfo(`Extracted ${workspaceArray.length} workspace and ${externalArray.length} external dependencies`);
		this.setStatus('Dynamic dependencies extracted', 'end');
	}

	private extractPackageName(importPath: string): string | null {
		// Skip relative imports
		if (importPath.startsWith('.') || importPath.startsWith('/')) {
			return null;
		}

		// Handle scoped packages: @scope/package or @scope/package/path
		if (importPath.startsWith('@')) {
			const parts = importPath.split('/');
			if (parts.length >= 2) {
				return `${parts[0]}/${parts[1]}`;
			}
			return null;
		}

		// Handle unscoped packages: package or package/path
		const firstSlash = importPath.indexOf('/');
		if (firstSlash === -1) {
			return importPath;
		}
		return importPath.substring(0, firstSlash);
	}

	public async mapExports() {
		this.setStatus('Mapping exports', 'start');

		// Get project root
		const projectRoot = this.runtimeContext.parentUnit.config.fullPath;

		// Find all TypeScript files in src/main
		const srcMainTs = `${this.config.fullPath}/src/main/**/*.ts`;
		const srcMainTsx = `${this.config.fullPath}/src/main/**/*.tsx`;

		const allFiles: string[] = [];
		for await (const file of glob(srcMainTs, {}))
			allFiles.push(file);
		for await (const file of glob(srcMainTsx, {}))
			allFiles.push(file);

		// Load previous errors if they exist (for retry capability)
		const previousErrors = await ExportMapper.loadPreviousErrors(projectRoot, this.config.key);

		// Map exports
		const {exports, errors} = await ExportMapper.mapExports(projectRoot, this.config.fullPath, this.config.key, allFiles, previousErrors || undefined);

		// Write exports to centralized location
		const indexPath = ExportMapper.getIndexPath(projectRoot, this.config.key);
		await FileSystemUtils.folder.create(indexPath);
		const outputPath = pathResolve(indexPath, '_export-for-import.json');
		await FileSystemUtils.file.write(outputPath, __stringify(exports, true));

		// Generate optimized index files
		await ExportMapper.generateIndexFiles(projectRoot, this.config.key, exports);

		// Write errors to centralized location (if any)
		await ExportMapper.writeErrors(projectRoot, this.config.key, errors);

		// Log summary
		this.logInfo(`Mapped ${exports.length} exports`);
		if (errors.length > 0) {
			this.logWarning(`Encountered ${errors.length} errors during export mapping. See ${indexPath}/_export-errors.json for details.`);
		}

		this.setStatus('Exports mapped', 'end');
	}

	async compile() {
		if (!this.dependencyUnits)
			await this.prepare();

		await this.clearOutputDirImpl();
		await this.compileImpl();
		await this.copyAssetsToOutput();
		await this.copyPackageJSONToOutput();

		await this.postCompile();
	}

	protected async postCompile() {
	}

	protected async copyPackageJSONToOutput() {
		const targetPath = resolve(this.config.output, CONST_PackageJSON);
		const params = this.deriveDistDependencies();
		const packageJson = FileSystemUtils.file.template.transform(__stringify(this.config.packageJson, true), params);
		this.logVerbose('Compiling params: ', params);
		this.logVerbose('Compiling from package.json: ', packageJson);
		await FileSystemUtils.file.template.write(targetPath, packageJson, params, DEFAULT_TEMPLATE_PATTERN);
	}

	async purge() {
		await FileSystemUtils.folder.delete(this.config.output);
		return super.purge();
	}

	async printDependencyTree() {
		const CONST_RunningRoot = process.cwd();
		this.logDebug(`Generating Dependency Tree - ${this.config.label}`);
		await this.allocateCommando(Commando_Basic)
			.cd(this.config.fullPath)
			.append(`mkdir -p ${CONST_RunningRoot}/.trash/dependencies`)
			.append(`pnpm list --depth 1000 > "${CONST_RunningRoot}/.trash/dependencies/${this.config.key}.txt"`)
			.execute();
	}

	async checkCyclicImports() {
		this.logDebug(`Checking Cyclic Imports - ${this.config.label}`);
		const pathToMain = pathResolve(this.config.fullPath, './src/main');
		const pathToTsConfig = pathResolve(pathToMain, './tsconfig.json');
		await this.allocateCommando(Commando_Basic)
			.cd(this.config.fullPath)
			// .setStdErrorValidator(stderr => {
			// 	return !stderr.includes('Finding files') && !stderr.includes('Image created');
			// })
			.append(`npx madge --no-spinner --ts-config ${pathToTsConfig} --image "./imports-${this.config.key}.svg" --extensions ts,tsx,mts,js,mjs --circular ${pathToMain} `)
			.append('echo $?')
			.execute();
	}

	// npx madge --circular --ts-config ./tsconfig.json --extensions ts,tsx,mts,js,mjs ./src/main

	async lint() {
		// need to move the copy of the default eslint rules to here

		const pathToLint = pathResolve(this.config.fullPath, `src/main`);
		// const extensions = extensionsToLint.map(ext => `--ext ${ext}`).join(' ');

		this.resolveESLintConfig();
		return new Promise<void>(async (resolve, reject) => {
			return this.allocateCommando(Commando_NVM)
				.cd(this.runtimeContext.parentUnit.config.fullPath)
				.pwd()
				.append(`./node_modules/.bin/eslint ${pathToLint}`)
				.execute((stdout, stderr, exitCode) => {
					if (exitCode > 0)
						return reject(new CommandoException(`Linting failed`, stdout, stderr, exitCode));

					resolve();
				});
		});
	}

	private resolveESLintConfig() {
		// Handle ESLint config setup
		const eslintConfigPath = pathResolve(this.config.fullPath, '.eslintrc.json');
		if (this.config.customESLintConfig) {
			if (!existsSync(eslintConfigPath))
				throw new BadImplementationException(`Expected custom eslint.rc\n${__stringify({
					unit: this.config.key,
				})}`);

			this.logVerbose(`eslintrc.json is defined custom`);
			return;
		}

		// const defaultEslint = pathResolve(baiDefaultsPath, '.eslintrc.json');
		// if (!existsSync(defaultEslint)) {
		// 	this.logError(`Missing default eslint configuration at path: ${defaultEslint}`);
		// 	throw new BadImplementationException(`Missing default eslint configuration at ${defaultEslint}\n${__stringify({
		// 		unit: this.config.key,
		// 		defaultPath: defaultEslint
		// 	})}`,);
		// }
		const projectDefaultEslint = pathResolve(this.runtimeContext.parentUnit.config.fullPath, this.runtimeContext.baiConfig.files?.typescript?.eslintConfig ?? `eslint.config.mjs`);

		if (existsSync(projectDefaultEslint)) {
			this.logDebug(`Copying project-level default eslint config..`);
			copyFileSync(projectDefaultEslint, eslintConfigPath);
			return;
		}


		// this.logDebug(`Copying default eslint configuration for unit: ${this.config.key}`);
		// copyFileSync(defaultEslint, eslintConfigPath);
	}

	protected deriveTSConfigPaths() {
		const unitKeys = this.runtimeContext.unitsMapper.getTransitiveDependencies([this.config.key]);
		const dependencyPaths = this.runtimeContext.unitsResolver<Unit_TypescriptLib>(unitKeys, Unit_TypescriptLib);

		return dependencyPaths.reduce((dependencies, unit) => {
			dependencies[unit.config.key] = [`${unit.config.fullPath}/src/main`];
			return dependencies;
		}, {} as TypedMap<string[]>);
	}


	protected async resolveTSConfig(srcFolder: string, sourceFolderType: string, tsConfigOverride?: RecursivePartial<TsConfig>) {
		const entryPath = pathResolve(srcFolder, sourceFolderType);
		if (!statSync(entryPath).isDirectory()) {
			return this.logError(`Unexpected non-directory entry in src/: ${sourceFolderType}`);
		}

		const tsConfigPath = pathResolve(entryPath, CONST_TS_CONFIG);
		if (this.config.customTSConfig) {
			if (!existsSync(tsConfigPath))
				throw new BadImplementationException(`Expected custom tsconfig in folder for source folder: ${entryPath}`);

			this.logVerbose(`${CONST_TS_CONFIG} is defined custom for source: ${sourceFolderType}, skipping copy.`);
			return;
		}

		// const defaultTsConfigTemplate = pathResolve(baiDefaultsPath, `tsconfig-${entry}.json`);
		const projectDefaultTsConfig = pathResolve(this.runtimeContext.parentUnit.config.fullPath, this.runtimeContext.baiConfig.files?.typescript?.tsConfig?.[sourceFolderType] ?? `tsconfig-${sourceFolderType}.json`);

		if (existsSync(projectDefaultTsConfig)) {
			this.logDebug(`Reading and merging project-level default tsconfig for source: ${sourceFolderType}`);

			// Read the template JSON file
			const templateConfig = await FileSystemUtils.file.read.json<TsConfig>(projectDefaultTsConfig);

			// Build the override config with conditional sourceMap settings
			const overrideConfig: RecursivePartial<TsConfig> = {
				...tsConfigOverride,
				compilerOptions: {
					...tsConfigOverride?.compilerOptions,
					...(this.runtimeContext.runtimeParams.publish ? {} : {
						sourceMap: true,
						sourceRoot: entryPath
					})
				}
			};

			// Merge template with override
			const mergedConfig = merge(templateConfig, overrideConfig) as TsConfig;

			// Write the merged config
			await FileSystemUtils.file.write.json(tsConfigPath, mergedConfig);
			return;
		}

		// if (existsSync(defaultTsConfigTemplate)) {
		// 	this.logDebug(`Copying default tsconfig for source: ${entry}`);
		// 	copyFileSync(defaultTsConfigTemplate, tsConfigPath);
		// 	continue;
		// }

		this.logError(`Missing tsconfig templates for source folder: ${sourceFolderType}`);
		throw new ImplementationMissingException(`Missing tsconfig template for source folder: ${sourceFolderType}`);
	}

	public async publish() {
		if (this.config.packageJson.private)
			return this.logInfo(`Not publishing a private package`);

		if (this.runtimeContext.runtimeParams.simulation) {
			this.logWarning(` ===> Publish Simulation -STARTED <=== `);
			this.logDebug(`Creating NPM Package`);
			await this.allocateCommando(Commando_Basic)
				.cd(this.config.output)
				.append('npm pack --pack-destination ./..')
				.execute();

			this.logDebug(`Publishing Dry Run`);
			await this.allocateCommando(Commando_Basic)
				.cd(this.config.output)
				.append('npm publish --dry-run')
				.execute();
			this.logWarning(` ===> Publish Simulation - ENDED <=== `);

			return;
		}

		this.logDebug(`Publishing Package - For REAL`);
		await this.allocateCommando(Commando_Basic)
			.cd(this.config.output)
			.append('npm publish --access public')
			.execute();
	}

	async convertToESM() {
		const ignore = ['node_modules', '.git', 'dist', '.gitignore', 'build'];
		const specificFiles = [CONST_PackageJSONTemplate];
		const fileExtensions = ['.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs'];
		const units = arrayToMap(this.runtimeContext.childUnits, unit => unit.config.key);

		const toESM = async (pathTofile: string, originImportPath: string) => {
			originImportPath = originImportPath.replace(/\/+/g, '/');
			if (originImportPath.endsWith('.js'))
				return originImportPath;

			if (originImportPath.endsWith('.json'))
				return originImportPath;

			for (const extension of fileExtensions) {
				if (!originImportPath.endsWith(extension))
					continue;

				originImportPath = originImportPath.replace(extension, '');
				break;
			}

			// this can be ./path/to/folder => ./path/to/folder/index.js
			// this can be ./path/to/file   => ./path/to/file.js
			if (originImportPath.startsWith('.') || originImportPath.startsWith('/')) {
				const initialPath = path.dirname(pathTofile);
				let relativePathToFile = originImportPath;

				const fullPath = path.resolve(initialPath, relativePathToFile);
				if (await FileSystemUtils.exists(fullPath) && await FileSystemUtils.folder.isFolder(fullPath))
					relativePathToFile = `${relativePathToFile}/index`;

				// either way we need to add a .js
				relativePathToFile += '.js';
				relativePathToFile = relativePathToFile.replace(/\/+/g, '/');

				return relativePathToFile;
			}

			const resolveImportPathFromUnit = async (packageName: string, relativePathToFile: string) => {
				const unit = units[packageName];
				if (!unit)
					return;

				let initialPath = `${unit.config.fullPath}/src/main`;
				const fullPath = path.resolve(initialPath, relativePathToFile);
				if (await FileSystemUtils.exists(fullPath) && await FileSystemUtils.folder.isFolder(fullPath))
					relativePathToFile = `${relativePathToFile}/index`;

				const importPath = `${packageName}/${relativePathToFile}`.replace(/\/+/g, '/');
				if (importPath === `${packageName}/index`)
					return `${packageName}`;

				return importPath;
			};

			// this can be {{libName}}/path/to/file   => {{libName}}/path/to/file
			let [libName1, ...rest1] = originImportPath.split('/');
			let esmImportPath = await resolveImportPathFromUnit(libName1, rest1.join('/'));
			if (esmImportPath)
				return esmImportPath;

			let [libOrg, libName2, ...rest2] = originImportPath.split('/');
			esmImportPath = await resolveImportPathFromUnit(`${libOrg}/${libName2}`, rest2.join('/'));
			if (esmImportPath)
				return esmImportPath;

			return originImportPath;
		};

		const importMatchers = [
			{
				regex: /from\s+"(\S+)?"/g,
				replacer: async (pathTofile: string, importPath: string) => `from "${await toESM(pathTofile, importPath)}"`
			},
			{
				regex: /from\s+'(\S+)?'/g,
				replacer: async (pathTofile: string, importPath: string) => `from '${await toESM(pathTofile, importPath)}'`
			},
			{
				regex: /\srequire\((\S+)?\)/g,
				replacer: async (pathTofile: string, importPath: string) => ` await import("${await toESM(pathTofile, importPath)}")`
			},
			{
				regex: /\srequire\((\S+)?\)/g,
				replacer: async (pathTofile: string, importPath: string) => ` await import('${await toESM(pathTofile, importPath)}')`
			},
			{
				regex: /\srequire\(\s*"(\S+)?"\s*\)/g,
				replacer: async (pathTofile: string, importPath: string) => ` await import("${await toESM(pathTofile, importPath)}")`
			},
			{
				regex: /\srequire\(\s*'(\S+)?'\s*\)/g,
				replacer: async (pathTofile: string, importPath: string) => ` await import('${await toESM(pathTofile, importPath)}')`
			},
			{
				regex: /import\(\s*"(\S+)?"\s*\)/g,
				replacer: async (pathTofile: string, importPath: string) => `import("${await toESM(pathTofile, importPath)}")`
			},
			{
				regex: /import\(\s*'(\S+)?'\s*\)/g,
				replacer: async (pathTofile: string, importPath: string) => `import('${await toESM(pathTofile, importPath)}')`
			},
		];

		const updateImports = async (pathToEntry: string) => {
			let content = await FileSystemUtils.file.read(pathToEntry);
			this.logDebug('Processing file: ', pathToEntry);
			for (const {regex, replacer} of importMatchers) {
				const matches: { original: string; path: string; index: number }[] = [];
				let match: RegExpExecArray | null;

				regex.lastIndex = 0;
				while ((match = regex.exec(content))) {
					matches.push({original: match[0], path: match[1], index: match.index});
					regex.lastIndex = match.index + match[0].length;
				}

				for (const {original, path} of matches) {
					const replacement = await replacer(pathToEntry, path);
					// Replace all exact original strings globally
					content = content.split(original).join(replacement);
				}
			}

			if (!this.runtimeContext.runtimeParams.simulation)
				await FileSystemUtils.file.write(pathToEntry, content);
		};

		const migratePackageJSON = async (pathToEntry: string) => {
			const packageJson = JSON.parse(await FileSystemUtils.file.read(pathToEntry));
			if (!packageJson.name.startsWith('@nu-art/'))
				packageJson.private = packageJson.private ?? true;

			packageJson.type = packageJson.type ?? 'module';
			packageJson.exports = packageJson.exports ?? {
				'.': {
					'types': './index.d.ts',
					'import': './index.js'
				},
				'./*': {
					'types': './*.d.ts',
					'import': './*.js'
				}
			};

			if (!this.runtimeContext.runtimeParams.simulation)
				await FileSystemUtils.file.write(pathToEntry, __stringify(packageJson, true));
		};

		await FileSystemUtils.folder.iterate(this.config.fullPath, {
			filter: async (pathToEntry) => {
				const name = path.basename(pathToEntry);
				if (ignore.includes(name))
					return false;

				if (await FileSystemUtils.folder.isFolder(pathToEntry))
					return true;

				if (!await FileSystemUtils.file.isFile(pathToEntry)) {
					this.logWarning(`NOT a file or folder: ${pathToEntry}`);
					return false;
				}

				if (specificFiles.includes(name))
					return true;

				const fileExtension = path.extname(pathToEntry);
				return fileExtensions.includes(fileExtension.toLowerCase());
			},
			processor: async (pathToEntry: string) => {
				const name = path.basename(pathToEntry);
				const fileExtension = path.extname(pathToEntry);

				if (name === CONST_PackageJSONTemplate)
					return await migratePackageJSON(pathToEntry);

				if (fileExtensions.includes(fileExtension.toLowerCase()))
					return await updateImports(pathToEntry);

			},
		});

	};
}