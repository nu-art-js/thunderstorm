import * as fs from 'fs';
import {copyFileSync, existsSync, promises as _fs, readdirSync, statSync} from 'fs';
import {__stringify, BadImplementationException, ImplementationMissingException, LogLevel, NotImplementedYetException, TypedMap} from '@nu-art/ts-common';
import {UnitPhaseImplementor} from '../core/types.js';
import {CONST_BaiConfig, CONST_FirebaseJSON, CONST_FirebaseRC, CONST_NodeModules, CONST_PackageJSON, CONST_TS_CONFIG} from '../../core/consts.js';
import {CommandoException} from '@nu-art/commando/shell/core/CliError';
import {Commando_NVM} from '@nu-art/commando/shell/plugins/nvm';
import {Commando_Basic} from '@nu-art/commando/shell/plugins/basic';
import {resolve, resolve as pathResolve} from 'path';
import {Unit_PackageJson, Unit_PackageJson_Config} from './Unit_PackageJson.js';
import {DEFAULT_OLD_TEMPLATE_PATTERN, DEFAULT_TEMPLATE_PATTERN, FileSystemUtils} from '../core/FileSystemUtils.js';
import {
	Phase_CheckCyclicImports,
	Phase_Compile,
	Phase_Lint,
	Phase_PreCompile,
	Phase_PrintDependencyTree,
	Phase_Publish,
	Phase_PublishDryRun,
	Phase_Test
} from '../phase/index.js';
import {ProjectUnit_RuntimeContext} from './ProjectUnit.js';
import {glob} from 'node:fs/promises';
import {TestType, TestTypes} from '../../core/params/params.js';


export type Unit_TypescriptLib_Config = Unit_PackageJson_Config & {
	customESLintConfig: boolean;
	customTSConfig: boolean;
	hasSelfHotReload: boolean
	output: string;
};

const assetExtensions = [
	'json',
	'scss',
	'svg',
	'png',
	'jpg',
	'jpeg',
	'rules',
	'_ts',
	'gif',
	'csv',
];


const defaultTestPatterns: Record<TestType, string> = {
	pure: '**/*.test.ts',
	firebase: '**/*.test.firebase.ts',
	ui: '**/*.test.ui.ts',
	mobile: '**/*.test.mobile.ts'
};
const CONST_ESM_PREFIX = 'export NODE_OPTIONS=\'--import data:text/javascript,import%20%7B%20register%20%7D%20from%20%22node%3Amodule%22%3B%20import%20%7B%20pathToFileURL%20%7D%20from%20%22node%3Aurl%22%3B%20register%28%22ts-node%2Fesm%22%2C%20pathToFileURL%28%22.%2F%22%29%29%3B\'';
const TestsCommandComposer: Record<TestType, (config: Unit_TypescriptLib_Config, runtimeContext: ProjectUnit_RuntimeContext) => Promise<string>> = {
	pure: async (config, runtimeContext) => {
		const command = resolve(runtimeContext.parentUnit.config.fullPath, 'node_modules/.bin/ts-mocha');
		const testFile = runtimeContext.runtimeParams.testFiles;
		const grep = testFile?.length ? ` '${testFile.join('\' \'')}'` : ` '${defaultTestPatterns.pure}'`;

		return `${CONST_ESM_PREFIX} && ${command} -p src/test/${CONST_TS_CONFIG} --timeout 0 ${grep}`;
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
};

export class Unit_TypescriptLib<C extends Unit_TypescriptLib_Config = Unit_TypescriptLib_Config>
	extends Unit_PackageJson<C>
	implements UnitPhaseImplementor<[Phase_PreCompile, Phase_Compile, Phase_PrintDependencyTree, Phase_CheckCyclicImports, Phase_Lint, Phase_Test, Phase_Publish, Phase_PublishDryRun]> {

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
		},
		ui: async () => {
			throw new NotImplementedYetException('UI tests not implemented yet');
		},
		mobile: async () => {
			throw new NotImplementedYetException('Mobile tests not implemented yet');
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
		await FileSystemUtils.folder.create(this.config.output);
		if (this.config.packageJson.private) {
			this.logError('HERE');
			// @ts-ignore
			this.publish = undefined;
			// @ts-ignore
			this.publishDryRun = undefined;
		}
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

		const command = resolve(this.runtimeContext.parentUnit.config.fullPath, CONST_NodeModules, 'typescript', 'bin', 'tsc');
		await this.executeAsyncCommando(commando, `${command} -p "${pathToTSConfig}" --rootDir "${pathToCompile}" --outDir "${this.config.output}"`,
			(stdout, stderr, exitCode) => {
				if (stderr.length)
					this.logError(stderr);

				if (exitCode > 0)
					throw new CommandoException(`Error compiling`, stdout, stderr, exitCode);
			});
	}

	protected async copyAssetsToOutput() {
		const command = `find . \\( -name ${assetExtensions.map(suffix => `'*.${suffix}'`)
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

	async compile() {
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
		await FileSystemUtils.file.template.write(targetPath, __stringify(this.config.packageJson, true), this.deriveDistDependencies(), DEFAULT_OLD_TEMPLATE_PATTERN);
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
		await this.allocateCommando(Commando_Basic)
			.cd(this.config.fullPath)
			// .setStdErrorValidator(stderr => {
			// 	return !stderr.includes('Finding files') && !stderr.includes('Image created');
			// })
			.append(`npx madge --no-spinner --image "./imports-${this.config.key}.svg" --circular ${this.config.output}`)
			.append('echo $?')
			.execute();
	}

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


	protected async resolveTSConfig(srcFolder: string, sourceFolderType: string) {
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
			this.logDebug(`Copying project-level default tsconfig for source: ${sourceFolderType}`);
			const dependencyPaths = {}; //this.deriveTSConfigPaths();
			await FileSystemUtils.file.template.copy(projectDefaultTsConfig, tsConfigPath, {SOURCE_ROOT: entryPath, PATHS: __stringify(dependencyPaths, true)});
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

	public async publishDryRun() {
		if (this.config.packageJson.private)
			return this.logWarning(`Not publishing a private package`);

		this.logDebug(`Creating NPM Package`);
		await this.allocateCommando(Commando_Basic)
			.cd(this.config.output)
			.append('npm pack')
			.execute();

		this.logDebug(`Publishing Dry Run`);
		await this.allocateCommando(Commando_Basic)
			.cd(this.config.output)
			.append('npm publish --dry-run')
			.execute();
	}


	public async publish() {
		if (this.config.packageJson.private)
			return this.logInfo(`Not publishing a private package`);

		this.logDebug(`Publishing Package - For REAL`);
		await this.allocateCommando(Commando_Basic)
			.cd(this.config.output)
			.append('echo "npm publish --access public" BAD BAD BAD')
			.execute();
	}
}