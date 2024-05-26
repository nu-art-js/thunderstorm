import {NVM} from '@nu-art/commando/cli/nvm';
import {Unit_Typescript} from './Unit_Typescript';
import * as fs from 'fs';
import {promises as _fs} from 'fs';
import {Cli_Basic} from '@nu-art/commando/cli/basic';
import {BadImplementationException} from '@nu-art/ts-common';
import {RunnerParamKey_ConfigPath} from '../../phase-runner/RunnerParams';
import {UnitPhaseImplementor} from '../types';
import {Phase_CheckCyclicImports, Phase_Compile, Phase_PreCompile, Phase_PrintDependencyTree, Phase_Purge} from '../../phase';

type _Config<Config> = {
	customTSConfig?: boolean;
	output: string;
} & Config;

type _RuntimeConfig<RTC> = {
	path: { pkg: string; output: string }
} & RTC;

export class Unit_TypescriptLib<Config extends {} = {}, RuntimeConfig extends {} = {},
	C extends _Config<Config> = _Config<Config>, RTC extends _RuntimeConfig<RuntimeConfig> = _RuntimeConfig<RuntimeConfig>>
	extends Unit_Typescript<C, RTC>
	implements UnitPhaseImplementor<[Phase_PreCompile, Phase_Compile, Phase_PrintDependencyTree, Phase_CheckCyclicImports, Phase_Purge]> {

	protected async init() {
		await super.init();
		this.runtime.path.output = this.runtime.path.pkg + `/${this.config.output}`;
	}

	//######################### Internal Logic #########################

	private async resolveTSConfig() {
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
}