import * as fs from 'fs';
import {copyFileSync, existsSync, promises as _fs, readdirSync, statSync} from 'fs';
import {__stringify, BadImplementationException, ImplementationMissingException, LogLevel} from '@nu-art/ts-common';
import {UnitPhaseImplementor} from '../../types/types';
import {Phase_CheckCyclicImports, Phase_Compile, Phase_Lint, Phase_PreCompile, Phase_PrintDependencyTree, Phase_Test} from '../../phase';
import {CONST_PackageJSON} from '../../core/consts';
import {RuntimeParams} from '../../core/params/params';
import {dispatcher_WatchReady, OnWatchReady} from '../../old/runner-dispatchers';
import {CommandoException} from '@nu-art/commando/shell/core/CliError';
import {Commando_NVM} from '@nu-art/commando/shell/plugins/nvm';
import {Commando_Basic} from '@nu-art/commando/shell/plugins/basic';
import {FilesCache} from '../core/FilesCache';
import {resolve, resolve as pathResolve} from 'path';
import {Unit_PackageJson, Unit_PackageJson_Config} from './Unit_PackageJson';
import {FileSystemUtils} from '../core/FileSystemUtils';


export type Unit_TypescriptLib_Config = Unit_PackageJson_Config & {
	customESLintConfig: boolean;
	customTSConfig: boolean;
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

export class Unit_TypescriptLib<C extends Unit_TypescriptLib_Config = Unit_TypescriptLib_Config>
	extends Unit_PackageJson<C>
	implements UnitPhaseImplementor<[
		Phase_PreCompile, Phase_Compile, Phase_PrintDependencyTree, Phase_CheckCyclicImports,
		Phase_Lint, Phase_Test
	]>, OnWatchReady {

	constructor(config: Unit_TypescriptLib<C>['config']) {
		super(config);
		this.addToClassStack(Unit_TypescriptLib);
	}

	async __onWatchReady() {
		return this.setStatus('Watching');
	}

	protected async init(setInitialized: boolean = true) {
		await super.init(false);
		dispatcher_WatchReady.addListener(this);
		if (setInitialized)
			this.setStatus('Initialized');
	}

	//######################### Internal Logic #########################

	protected async resolveTSConfig() {
		const pathToUnitTSConfig = `${this.config.fullPath}/src/main/tsconfig.json`;
		// const pathToProjectTSConfig = '';

		//If set to use a custom ts config
		if (this.config.customTSConfig) {
			//If ts config file does not exist in the main folder
			if (!fs.existsSync(pathToUnitTSConfig))
				throw new BadImplementationException(`Unit "${this.config.label}" is set to use a custom tsconfig but is missing a tsconfig.json file in /src/main`);

			return;
		}


		//Make sure a project ts config file exists
		const pathToProjectTSConfig = this.runtimeContext.baiConfig.files?.typescript?.tsConfig;
		if (!pathToProjectTSConfig)
			throw new ImplementationMissingException(`Project config is missing the default tsConfig file, add it to the bai-config.json`);

		if (!fs.existsSync(pathToProjectTSConfig))
			throw new BadImplementationException(`Project is missing a tsconfig.json file in path ${pathToProjectTSConfig}`);

		let tsConfig = await FilesCache.load.text(pathToProjectTSConfig);
		tsConfig = tsConfig.replace('SOURCE_ROOT', `${this.config.fullPath}/src/main`);
		await _fs.writeFile(pathToUnitTSConfig, tsConfig, {encoding: 'utf-8'});
	}

	protected async clearOutputDir() {
		if (!RuntimeParams.clean)
			return;

		await this.clearOutputDirImpl();
	}

	private async clearOutputDirImpl() {
		await FileSystemUtils.folder.empty(this.config.output, false);
		await FileSystemUtils.folder.create(this.config.output);
	}

	protected async compileImpl() {
		const pathToCompile = `${this.config.fullPath}/src/main`;
		const pathToTSConfig = `${pathToCompile}/tsconfig.json`;

		const commando = this.allocateCommando(Commando_NVM, Commando_Basic)
			.cd(this.config.fullPath)
			.setLogLevelFilter((log, std) => {
				return LogLevel.Error;
			})
			.addLogProcessor((log) => !log.includes('Now using node') && !log.includes('.nvmrc\' with version'));

		await this.executeAsyncCommando(commando, `tsc -p "${pathToTSConfig}" --rootDir "${pathToCompile}" --outDir "${this.config.output}"`,
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
	}

	protected async copyPackageJSONToOutput() {
		const targetPath = `${this.config.output}/${CONST_PackageJSON}`;
		const fileContent = JSON.stringify(this.packageJson.dist, null, 2);
		await _fs.writeFile(targetPath, fileContent, {encoding: 'utf-8'});
	}

	/**
	 * Watch compile actions, use this to perform all necessary compile actions for watch.
	 * watch compile is a subset of the general watch action
	 */
	public async watchCompile() {
		try {
			this.setStatus('Compiling', 'start');
			await this.compile();
			this.setStatus(`Compiled and Watching`, 'end');
		} catch (e: any) {
			this.setStatus(`Watching with error`, e);
			throw e;
		}
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

	async preCompile() {
		if (!fs.existsSync(`${this.config.fullPath}/prebuild.sh`))
			return;

		this.setStatus('Pre-Compile');
		await this.allocateCommando(Commando_Basic)
			.cd(this.config.fullPath)
			.append('bash prebuild.sh')
			.execute();
	}

	async compile() {
		try {
			this.setStatus('Compiling', 'start');
			// await this.resolveTSConfig();
			await this.clearOutputDirImpl();
			await this.compileImpl();
			await this.copyAssetsToOutput();
			await this.copyPackageJSONToOutput();
			this.setStatus(`Compiled`, 'end');
		} catch (e: any) {
			this.setErrorStatus('Compilation Error', e);

			if (!RuntimeParams.watch)
				throw e;
		}
	}

	async purge() {
		await FileSystemUtils.folder.delete(this.config.output);
		return super.purge();
	}

	async runTests() {
		if (!RuntimeParams.test)
			return;

		this.setStatus('Running tests', 'start');
		const command = resolve(this.runtimeContext.parentUnit.config.fullPath, 'node_modules/.bin/mocha');
		const testCommand = `${command} "src/test/**/*.test.ts" --require ts-node/register`;
		await this.allocateCommando(Commando_NVM)
			.cd(this.config.fullPath)
			.append(testCommand)
			.execute((stdout, stderr, exitCode) => {
				if (exitCode !== 0)
					throw new CommandoException(`Error running tests`, stdout, stderr, exitCode);
			});

		this.setStatus('Tests passed', 'end');

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

		return new Promise<void>(async (resolve, reject) => {
			this.allocateCommando(Commando_NVM)
				.cd('/Users/tacb0ss/dev/nu-art/beamz/_thunderstorm/build-and-install/src/test/units/lint/temp/workspace')
				.pwd()
				.append(`./node_modules/.bin/eslint --debug ${pathToLint}`)
				.execute((stdout, stderr, exitCode) => {
					if (exitCode > 0)
						return reject(new CommandoException(`Linting failed`, stdout, stderr, exitCode));

					resolve();
				});
		});
	}


	/**
	 * Prepares the workspace for this project unit.
	 * Ensures tsconfig.json files exist in the proper source folders,
	 * and copies .eslintrc.json if necessary, handling fallback scenarios cleanly.
	 */
	async prepare(params: { baiDefaultsPath: string; projectRoot: string; }) {
		const {baiDefaultsPath, projectRoot} = params;

		this.logDebug(`Preparing workspace for unit: ${this.config.key}`);
		this.logVerbose(`Parameters: baiDefaultsPath=${baiDefaultsPath}, projectRoot=${projectRoot}`);

		// Handle source folder tsconfig setup
		const srcFolder = pathResolve(this.config.fullPath, 'src');
		if (!existsSync(srcFolder))
			return;

		const entries = readdirSync(srcFolder);
		for (const entry of entries) {
			const entryPath = pathResolve(srcFolder, entry);
			if (!statSync(entryPath).isDirectory()) {
				this.logError(`Unexpected non-directory entry in src/: ${entry}`);
				throw new BadImplementationException(`Non-directory entry under src folder\n ${__stringify({
					unit: this.config.key,
					invalidEntry: entry
				})}`);
			}

			const tsConfigPath = pathResolve(entryPath, 'tsconfig.json');
			if (this.config.customTSConfig) {
				if (!existsSync(tsConfigPath))
					throw new BadImplementationException(`Expected custom tsconfig in folder for source folder: ${entryPath}\n${__stringify({
						unit: this.config.key,
						sourceFolder: entry,
					})}`);

				this.logVerbose(`tsconfig.json is defined custom for source: ${entry}, skipping copy.`);
				continue;
			}

			const defaultTsConfigTemplate = pathResolve(baiDefaultsPath, `tsconfig-${entry}.json`);
			const projectDefaultTsConfig = pathResolve(projectRoot, 'defaults', 'tsconfig.json');

			if (existsSync(projectDefaultTsConfig)) {
				this.logDebug(`Copying project-level default tsconfig for source: ${entry}`);
				copyFileSync(projectDefaultTsConfig, tsConfigPath);
				continue;
			}

			if (existsSync(defaultTsConfigTemplate)) {
				this.logDebug(`Copying default tsconfig for source: ${entry}`);
				copyFileSync(defaultTsConfigTemplate, tsConfigPath);
				continue;
			}

			this.logError(`Missing tsconfig templates for source folder: ${entry}`);
			throw new ImplementationMissingException(`Missing tsconfig template for source folder: ${entry}\n${__stringify({
				unit: this.config.key,
				sourceFolder: entry,
				checkedPaths: [defaultTsConfigTemplate, projectDefaultTsConfig]
			})}`);
		}

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

		const defaultEslint = pathResolve(baiDefaultsPath, '.eslintrc.json');
		if (!existsSync(defaultEslint)) {
			this.logError(`Missing default eslint configuration at path: ${defaultEslint}`);
			throw new BadImplementationException(`Missing default eslint configuration at ${defaultEslint}\n${__stringify({
				unit: this.config.key,
				defaultPath: defaultEslint
			})}`,);
		}

		this.logDebug(`Copying default eslint configuration for unit: ${this.config.key}`);
		copyFileSync(defaultEslint, eslintConfigPath);
	}
}