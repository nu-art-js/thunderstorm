import {UnitPhaseImplementor} from '../types';
import {Unit_Typescript, Unit_Typescript_Config, Unit_Typescript_RuntimeConfig} from './Unit_Typescript';
import {Phase_Install} from '../../phase';
import {RuntimeParams} from '../../../core/params/params';
import {StringMap} from '@nu-art/ts-common/utils/types';
import {_keys} from '@nu-art/ts-common';
import {NVM} from '@nu-art/commando/cli/nvm';
import {PNPM} from '@nu-art/commando/cli/pnpm';
import {MemKey_PhaseRunner} from '../../phase-runner/consts';

type Unit_TypescriptProject_Config = Unit_Typescript_Config & {globalPackages?: StringMap;};

type Unit_TypescriptProject_RuntimeConfig = Unit_Typescript_RuntimeConfig & {};

export class Unit_TypescriptProject<C extends Unit_TypescriptProject_Config = Unit_TypescriptProject_Config, RTC extends Unit_TypescriptProject_RuntimeConfig = Unit_TypescriptProject_RuntimeConfig>
	extends Unit_Typescript<C, RTC>
	implements UnitPhaseImplementor<[Phase_Install]> {

	constructor(config: Unit_TypescriptProject<C>['config']) {
		super(config);
		this.addToClassStack(Unit_TypescriptProject);
	}


	//######################### Internal Logic #########################

	private async installGlobals () {
		if((!RuntimeParams.install && !RuntimeParams.installGlobals) || !this.config.globalPackages)
			return;

		const packages = _keys(this.config.globalPackages)
			.reduce((acc, pkg) => {
				acc.push(`${pkg as string}@${this.config.globalPackages![pkg as string]}`);
				return acc;
			}, [] as string[]);
		this.logInfo(`Installing Global Packages: ${packages.join(' ')}`);
		await NVM.createCommando().append(`npm i -g ${packages.join(' ')}`).execute();
	}

	private async installPackages () {
		if(!RuntimeParams.install && !RuntimeParams.installPackages)
			return;

		const runner = MemKey_PhaseRunner.get();
		const units = runner.getUnits().filter(unit => unit instanceof Unit_Typescript) as Unit_Typescript[];
		const packages =units.map(unit=>unit.config.pathToPackage)
		await PNPM.createWorkspace(packages);
		await PNPM.installPackages(NVM.createCommando());
	}

	//######################### Phase Implementation #########################

	async install() {
		await this.installGlobals();
		await this.installPackages();
	}
}