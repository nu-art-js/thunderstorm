import {Unit_Typescript, Unit_Typescript_Config, Unit_Typescript_RuntimeConfig} from './Unit_Typescript';
import * as fs from 'fs';
import {promises as _fs} from 'fs';
import {BadImplementationException, LogLevel} from '@nu-art/ts-common';
import {MemKey_RunnerParams, RunnerParamKey_ConfigPath} from '../../phase-runner/RunnerParams';
import {UnitPhaseImplementor} from '../types';
import {
	Phase_CheckCyclicImports,
	Phase_Compile,
	Phase_Lint,
	Phase_PreCompile,
	Phase_PrintDependencyTree,
	Phase_Purge
} from '../../phase';
import {CONST_PackageJSON} from '../../../core/consts';
import {RuntimeParams} from '../../../core/params/params';
import {dispatcher_WatchReady, OnWatchReady} from '../runner-dispatchers';
import {CommandoException} from '@nu-art/commando/shell/core/CliError';
import {Commando_NVM} from '@nu-art/commando/shell/plugins/nvm';
import {Commando_Basic} from '@nu-art/commando/shell/plugins/basic';


export type Unit_TypescriptLib_Config = Unit_Typescript_Config & {
	customTSConfig?: boolean;
	output: string;
};

export type Unit_TypescriptLib_RuntimeConfig = Unit_Typescript_RuntimeConfig & {
	pathTo: { pkg: string; output: string }
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
	'_ts'
];

export class Unit_TypescriptLib<C extends Unit_TypescriptLib_Config = Unit_TypescriptLib_Config, RTC extends Unit_TypescriptLib_RuntimeConfig = Unit_TypescriptLib_RuntimeConfig>
	extends Unit_Typescript<C, RTC>
	implements UnitPhaseImplementor<[
		Phase_PreCompile, Phase_Compile, Phase_PrintDependencyTree, Phase_CheckCyclicImports,
		Phase_Purge, Phase_Lint,
	]>, OnWatchReady {

	constructor(config: Unit_TypescriptLib<C, RTC>['config']) {
		super(config);
		this.addToClassStack(Unit_TypescriptLib);
	}

	async __onWatchReady() {
		return this.setStatus('Watching');
	}

	protected async init(setInitialized: boolean = true) {
		await super.init(false);
		dispatcher_WatchReady.addListener(this);
		this.runtime.pathTo.output = this.runtime.pathTo.pkg + `/${this.config.output}`;
		if (setInitialized)
			this.setStatus('Initialized');
	}

	//######################### Internal Logic #########################

	protected async resolveTSConfig() {
		const pathToUnitTSConfig = `${this.runtime.pathTo.pkg}/src/main/tsconfig.json`;
		// const pathToProjectTSConfig = '';

		//If set to use a custom ts config
		if (this.config.customTSConfig) {
			//If ts config file does not exist in the main folder
			if (!fs.existsSync(pathToUnitTSConfig))
				throw new BadImplementationException(`Unit "${this.config.label}" is set to use a custom tsconfig but is missing a tsconfig.json file in /src/main`);

			return;
		}

		//Copy project ts config file into the unit main folder
		const pathToProjectConfig = this.getRunnerParam(RunnerParamKey_ConfigPath);
		if (!pathToProjectConfig)
			throw new BadImplementationException('Could not get config path from runner params');

		//Make sure a project ts config file exists
		const pathToProjectTSConfig = pathToProjectConfig + '/tsconfig.json';
		if (!fs.existsSync(pathToProjectTSConfig))
			throw new BadImplementationException(`Project is missing a tsconfig.json file in path ${pathToProjectConfig}`);

		//Copy the file into the unit
		await _fs.copyFile(pathToProjectTSConfig, pathToUnitTSConfig);
	}

	protected async clearOutputDir() {
		if (!RuntimeParams.clean)
			return;

		//Return if output dir doesn't exist
		if (!fs.existsSync(this.runtime.pathTo.output))
			return;

		await _fs.rm(this.runtime.pathTo.output, {recursive: true, force: true});
		await _fs.mkdir(this.runtime.pathTo.output, {recursive: true});
	}

	protected async compileImpl() {
		const pathToCompile = `${this.runtime.pathTo.pkg}/src/main`;
		const pathToTSConfig = `${pathToCompile}/tsconfig.json`;

		const commando = this.allocateCommando(Commando_NVM, Commando_Basic)
			.cd(this.runtime.pathTo.pkg)
			.append(`tsc -p "${pathToTSConfig}" --rootDir "${pathToCompile}" --outDir "${this.runtime.pathTo.output}"`)
			.setLogLevelFilter((log, std) => {
				return LogLevel.Error;
			})
			.addLogProcessor((log) => !log.includes('Now using node') && !log.includes('.nvmrc\' with version'));

		await this.executeAsyncCommando(commando, (stdout, stderr, exitCode) => {
			if (stderr.length)
				this.logError(stderr);

			if (exitCode > 0)
				throw new CommandoException(`Error compiling`, stdout, stderr, exitCode);
		});
	}

	protected async copyAssetsToOutput() {
		const command = `find . \\( -name ${assetExtensions.map(suffix => `'*.${suffix}'`)
			.join(' -o -name ')} \\) | cpio -pdmuv "${this.runtime.pathTo.output}" > /dev/null 2>&1`;
		await this.allocateCommando(Commando_Basic)
			.cd(`${this.runtime.pathTo.pkg}/src/main`)
			// .setStdErrorValidator(stderr => {
			// 	return !stderr.match(/\d+\sblock/);
			// })
			.append(command)
			.execute();
	}

	protected async copyPackageJSONToOutput() {
		const targetPath = `${this.runtime.pathTo.output}/${CONST_PackageJSON}`;
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
		if (!fs.existsSync(`${this.config.pathToPackage}/prebuild.sh`))
			return;

		this.setStatus('Pre-Compile');
		await this.allocateCommando(Commando_Basic)
			.cd(this.runtime.pathTo.pkg)
			.append('bash prebuild.sh')
			.execute();
	}

	async compile() {
		try {
			this.setStatus('Compiling', 'start');
			await this.resolveTSConfig();
			await this.clearOutputDir();
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
		await _fs.rm(this.runtime.pathTo.output, {recursive: true, force: true});
	}

	async printDependencyTree() {
		const CONST_RunningRoot = process.cwd();
		this.logDebug(`Generating Dependency Tree - ${this.config.label}`);
		await this.allocateCommando(Commando_Basic)
			.cd(this.runtime.pathTo.pkg)
			.append(`mkdir -p ${CONST_RunningRoot}/.trash/dependencies`)
			.append(`pnpm list --depth 1000 > "${CONST_RunningRoot}/.trash/dependencies/${this.config.key}.txt"`)
			.execute();
	}

	async checkCyclicImports() {
		this.logDebug(`Checking Cyclic Imports - ${this.config.label}`);
		await this.allocateCommando(Commando_Basic)
			.cd(this.runtime.pathTo.pkg)
			// .setStdErrorValidator(stderr => {
			// 	return !stderr.includes('Finding files') && !stderr.includes('Image created');
			// })
			.append(`npx madge --no-spinner --image "./imports-${this.config.key}.svg" --circular ${this.runtime.pathTo.output}`)
			.append('echo $?')
			.execute();
	}

	async lint() {
		const pathToProjectESLint = `${MemKey_RunnerParams.get()[RunnerParamKey_ConfigPath]}/eslint.config.cjs`;
		const pathToLint = `${this.runtime.pathTo.pkg}src/main`;
		const extensions = extensionsToLint.map(ext => `--ext ${ext}`).join(' ');

		await this.allocateCommando(Commando_NVM)
			.append(`eslint --config ${pathToProjectESLint} ${extensions} ${pathToLint}`)
			.execute();
	}
}