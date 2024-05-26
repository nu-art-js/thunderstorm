import {UnitPhaseImplementor} from '../types';
import {Unit_Typescript} from './Unit_Typescript';
import {Phase_Install} from '../../phase';
import {RuntimeParams} from '../../../core/params/params';
import {StringMap} from '@nu-art/ts-common/utils/types';
import {_keys} from '@nu-art/ts-common';
import {NVM} from '@nu-art/commando/cli/nvm';
import {MemKey_ProjectConfig} from '../../phase-runner/RunnerParams';
import {PNPM} from '@nu-art/commando/cli/pnpm';

type _Config<Config> = {
	globalPackages?: StringMap;
} & Config;

type _RuntimeConfig<RTC> = {} & RTC;

export class Unit_TypescriptProject<Config extends {} = {}, RuntimeConfig extends {} = {},
	C extends _Config<Config> = _Config<Config>, RTC extends _RuntimeConfig<RuntimeConfig> = _RuntimeConfig<RuntimeConfig>>
	extends Unit_Typescript<C, RTC>
	implements UnitPhaseImplementor<[Phase_Install]> {

	async install() {
		const installGlobals = RuntimeParams.install || RuntimeParams.installGlobals;
		const installPackages = RuntimeParams.install || RuntimeParams.installPackages;

		if (installGlobals && this.config.globalPackages) {
			const packages = _keys(this.config.globalPackages)
				.reduce((acc, pkg) => {
					acc.push(`${pkg as string}@${this.config.globalPackages![pkg as string]}`);
					return acc;
				}, [] as string[]);
			this.logInfo(`Installing Global Packages: ${packages.join(' ')}`);
			await NVM.createCommando().append(`npm i -g ${packages.join(' ')}`).execute();
		}

		if (installPackages) {
			const units = MemKey_ProjectConfig.get().units.filter(unit => unit instanceof Unit_Typescript) as Unit_Typescript[];
			const packages = units.map(unit=>unit.config.pathToPackage)
			await PNPM.createWorkspace(packages);
			await PNPM.installPackages(NVM.createCommando());
		}
	}
}