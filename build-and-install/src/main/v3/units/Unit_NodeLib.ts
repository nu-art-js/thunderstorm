import {Unit_NodePackage, Unit_Typescript_Config} from './Unit_NodePackage';
import * as fs from 'fs';
import {promises as _fs} from 'fs';
import {BadImplementationException, ImplementationMissingException, LogLevel} from '@nu-art/ts-common';
import {MemKey_RunnerParams, RunnerParamKey_ConfigPath} from '../../v2/phase-runner/RunnerParams';
import {UnitPhaseImplementor} from '../../types/types';
import {Phase_CheckCyclicImports, Phase_Compile, Phase_Lint, Phase_PreCompile, Phase_PrintDependencyTree} from '../../phase';
import {CONST_PackageJSON} from '../../core/consts';
import {RuntimeParams} from '../../core/params/params';
import {dispatcher_WatchReady, OnWatchReady} from '../../v2/unit/runner-dispatchers';
import {CommandoException} from '@nu-art/commando/shell/core/CliError';
import {Commando_NVM} from '@nu-art/commando/shell/plugins/nvm';
import {Commando_Basic} from '@nu-art/commando/shell/plugins/basic';
import {FilesCache} from '../core/FilesCache';


export type Unit_TypescriptLib_Config = Unit_Typescript_Config & {
	customTSConfig?: boolean;
	output: string;
};

const extensionsToLint = ['ts', 'tsx'];
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

export class Unit_NodeLib<C extends Unit_TypescriptLib_Config = Unit_TypescriptLib_Config>
	extends Unit_NodePackage<C>
	implements UnitPhaseImplementor<[
		Phase_PreCompile, Phase_Compile, Phase_PrintDependencyTree, Phase_CheckCyclicImports,
		Phase_Lint,
	]>, OnWatchReady {

	constructor(config: Unit_NodeLib<C>['config']) {
		super(config);
		this.addToClassStack(Unit_NodeLib);
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
		const pathToProjectTSConfig = this.baiConfig.files?.typescript?.tsConfig;
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
		//Return if output dir doesn't exist
		if (!fs.existsSync(this.config.output))
			return;

		await _fs.rm(this.config.output, {recursive: true, force: true});
		await _fs.mkdir(this.config.output, {recursive: true});
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

			// perform all watch actions
			await this.compileImpl();
			await this.copyAssetsToOutput();
			this.setStatus(`Compiled and Watching`, 'end');
		} catch (e: any) {
			this.setStatus(`Watching with error`, e);
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
		await _fs.rm(this.config.output, {recursive: true, force: true});
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
		const pathToProjectESLint = `${MemKey_RunnerParams.get()[RunnerParamKey_ConfigPath]}/eslint.config.cjs`;
		const pathToLint = `${this.config.fullPath}src/main`;
		const extensions = extensionsToLint.map(ext => `--ext ${ext}`).join(' ');

		await this.allocateCommando(Commando_NVM)
			.append(`eslint --config ${pathToProjectESLint} ${extensions} ${pathToLint}`)
			.execute();
	}
}