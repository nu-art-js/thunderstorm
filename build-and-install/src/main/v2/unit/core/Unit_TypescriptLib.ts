import {NVM} from '@nu-art/commando/cli/nvm';
import {Unit_Typescript} from './Unit_Typescript';
import {Phase_Compile, Phase_PreCompile, UnitPhaseImplementor} from './types';
import * as fs from 'fs';
import {Cli_Basic} from '@nu-art/commando/cli/basic';
import {BadImplementationException} from '@nu-art/ts-common';

type _Config<Config> = {
	customTSConfig?: boolean;
} & Config

export class Unit_TypescriptLib<Config extends {} = {}, C extends _Config<Config> = _Config<Config>>
	extends Unit_Typescript<C>
	implements UnitPhaseImplementor<[Phase_PreCompile, Phase_Compile]> {

	//######################### Internal Logic #########################

	private async resolveTSConfig() {
		const pathToUnitTSConfig = `${this.config.pathToPackage}/src/main/tsconfig.json`;
		// const pathToProjectTSConfig = '';

		//If set to use a custom ts config
		if (this.config.customTSConfig) {
			//If ts config file does not exist in the main folder
			if (!fs.existsSync(pathToUnitTSConfig))
				throw new BadImplementationException(`Unit ${this.config.label} missing tsconfig.json file in /src/main`);

			return;
		}

		//Copy project ts config file into the unit main folder

	}

	//######################### Phase Implementations #########################

	async preCompile() {
		if (!fs.existsSync(`${this.config.pathToPackage}/prebuild.sh`))
			return;

		await NVM.createCommando(Cli_Basic)
			.cd(this.config.pathToPackage)
			.append('bash prebuild.sh')
			.execute();
	}

	async compile() {
		await this.resolveTSConfig();
	}
}