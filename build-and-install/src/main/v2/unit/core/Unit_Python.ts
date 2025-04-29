import {Phase_Install} from '../../../phase';
import {UnitPhaseImplementor} from '../../../types/types';
import {BaseUnit, BaseUnit_Config, BaseUnit_RuntimeConfig} from '../../../v3/units/BaseUnit';
import {convertToFullPath} from '@nu-art/commando/shell/tools';
import {Commando_Python3} from '@nu-art/commando/shell/plugins/python';


export type Unit_Python_Config = BaseUnit_Config & {
	fullPath: string
}

export type Unit_Python_RuntimeConfig = BaseUnit_RuntimeConfig & {
	pathTo: { pkg: string };
}

export class Unit_Python<C extends Unit_Python_Config = Unit_Python_Config, RTC extends Unit_Python_RuntimeConfig = Unit_Python_RuntimeConfig>
	extends BaseUnit<C, RTC>
	implements UnitPhaseImplementor<[Phase_Install]> {

	constructor(config: Unit_Python<C, RTC>['config']) {
		super(config);
		this.addToClassStack(Unit_Python);
	}

	protected async init() {
		await super.init();
		this.runtime.pathTo = {
			pkg: convertToFullPath(this.config.fullPath),
		};
	}

	//######################### Phase Implementation #########################

	async install() {
		const commando = await this.allocateCommando(Commando_Python3)
			.cd(this.config.fullPath)
			.installVenv();

		await commando.sourceVenv().installRequirements();
	}
}