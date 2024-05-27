import {NVM} from '@nu-art/commando/cli/nvm';
import {Unit_Typescript} from './Unit_Typescript';
import * as fs from 'fs';
import {promises as _fs} from 'fs';
import {Cli_Basic} from '@nu-art/commando/cli/basic';
import {BadImplementationException} from '@nu-art/ts-common';
import {MemKey_RunnerParams, RunnerParamKey_ConfigPath} from '../../phase-runner/RunnerParams';
import {UnitPhaseImplementor} from '../types';
import {Phase_CheckCyclicImports, Phase_Compile, Phase_Lint, Phase_PreCompile, Phase_PrintDependencyTree, Phase_Purge} from '../../phase';
import {Commando} from '@nu-art/commando/core/cli';
import {CONST_PackageJSON} from '../../../core/consts';

type _Config<Config> = {
	customTSConfig?: boolean;
	output: string;
} & Config;

type _RuntimeConfig<RTC> = {
	path: { pkg: string; output: string }
} & RTC;

const extensionsToLint = ['.ts', '.tsx'];
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

export class Unit_TypescriptLib<Config extends {} = {}, RuntimeConfig extends {} = {},
	C extends _Config<Config> = _Config<Config>, RTC extends _RuntimeConfig<RuntimeConfig> = _RuntimeConfig<RuntimeConfig>>
	extends Unit_Typescript<C, RTC>
	implements UnitPhaseImplementor<[
		Phase_PreCompile, Phase_Compile, Phase_PrintDependencyTree, Phase_CheckCyclicImports,
		Phase_Purge, Phase_Lint,
	]> {

	protected async init() {
		await super.init();
		this.runtime.path.output = this.runtime.path.pkg + `/${this.config.output}`;
	}

	//######################### Internal Logic #########################

	protected async resolveTSConfig() {
		const pathToUnitTSConfig = `${this.runtime.path.pkg}/src/main/tsconfig.json`;
		// const pathToProjectTSConfig = '';

		//If set to use a custom ts config
		if (this.config.customTSConfig) {
			//If ts config file does not exist in the main folder
			if (!fs.existsSync(pathToUnitTSConfig))
				throw new BadImplementationException(`Unit ${this.config.label} is set to use a custom tsconfig but is missing a tsconfig.json file in /src/main`);

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
		//Return if output dir doesn't exist
		if (!fs.existsSync(this.runtime.path.output))
			return;

		await _fs.rm(this.runtime.path.output, {recursive: true, force: true});
		await _fs.mkdir(this.runtime.path.output, {recursive: true});
	}

	protected async compileImpl() {
		const pathToCompile = `${this.runtime.path.pkg}/src/main`;
		const pathToTSConfig = `${pathToCompile}/tsconfig.json`;

		await NVM
			.createCommando(Cli_Basic)
			.setUID(this.config.key)
			.cd(this.runtime.path.pkg)
			.append(`tsc -p "${pathToTSConfig}" --rootDir "${pathToCompile}" --outDir "${this.runtime.path.output}"`)
			.execute();
	}

	protected async copyAssetsToOutput() {
		const command = `find . \\( -name ${assetExtensions.map(suffix => `'*.${suffix}'`).join(' -o -name ')} \\) | cpio -pdm "${this.runtime.path.output}" > /dev/null`;
		await Commando
			.create(Cli_Basic)
			.cd(`${this.runtime.path.pkg}/src/main`)
			.setStdErrorValidator(stderr => {
				return !stderr.match(/\d+\sblock/);
			})
			.append(command)
			.execute();
	}

	protected async copyPackageJSONToOutput() {
		const targetPath = `${this.runtime.path.output}/${CONST_PackageJSON}`;
		const fileContent = JSON.stringify(this.packageJson.dist, null, 2);
		await _fs.writeFile(targetPath, fileContent, {encoding: 'utf-8'});
	}

	//######################### Phase Implementations #########################

	async preCompile() {
		if (!fs.existsSync(`${this.config.pathToPackage}/prebuild.sh`))
			return;

		this.setStatus('Pre-Compile');
		await NVM.createCommando(Cli_Basic)
			.cd(this.runtime.path.pkg)
			.append('bash prebuild.sh')
			.execute();
	}

	async compile() {
		this.setStatus('Compile');
		await this.resolveTSConfig();
		await this.clearOutputDir();
		await this.compileImpl();
		await this.copyAssetsToOutput();
		await this.copyPackageJSONToOutput();
	}

	async purge() {
		await _fs.rm(this.runtime.path.output, {recursive: true, force: true});
	}

	async printDependencyTree() {
		const CONST_RunningRoot = process.cwd();
		this.logDebug(`Generating Dependency Tree - ${this.config.label}`);
		await NVM.createCommando(Cli_Basic)
			.cd(this.runtime.path.pkg)
			.append(`mkdir -p ${CONST_RunningRoot}/.trash/dependencies`)
			.append(`pnpm list --depth 1000 > "${CONST_RunningRoot}/.trash/dependencies/${this.config.key}.txt"`)
			.execute();
	}

	async checkCyclicImports() {
		this.logDebug(`Checking Cyclic Imports - ${this.config.label}`);
		await NVM.createCommando(Cli_Basic)
			.cd(this.runtime.path.pkg)
			.setStdErrorValidator(stderr => {
				return !stderr.includes('Finding files') && !stderr.includes('Image created');
			})
			.append(`npx madge --no-spinner --image "./imports-${this.config.key}.svg" --circular ${this.runtime.path.output}`)
			.append('echo $?')
			.execute();
	}

	async lint() {
		const pathToProjectESLint = MemKey_RunnerParams.get()[RunnerParamKey_ConfigPath] + '/.eslintrc.js';
		const pathToLint = this.runtime.path.pkg + 'src/main';
		const extensions = extensionsToLint.map(ext => `--ext ${ext}`).join(' ');

		await NVM.createCommando()
			.append(`eslint --config ${pathToProjectESLint} ${extensions} ${pathToLint}`)
			.execute();
	}
}