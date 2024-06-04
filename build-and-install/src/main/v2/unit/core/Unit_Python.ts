import {Phase_Install} from '../../phase';
import {UnitPhaseImplementor} from '../types';
import {BaseUnit, BaseUnit_Config, BaseUnit_RuntimeConfig} from './BaseUnit';
import {Commando, CommandoInteractive} from '@nu-art/commando/core/cli';
import {convertToFullPath} from '@nu-art/commando/core/tools';
import {Cli_Basic} from '@nu-art/commando/cli/basic';

export type Unit_Python_Config = BaseUnit_Config & {
	pathToPackage: string
}

export type Unit_Python_RuntimeConfig = BaseUnit_RuntimeConfig & {
	pathTo: { pkg: string };
}

export class Unit_Python<C extends Unit_Python_Config = Unit_Python_Config, RTC extends Unit_Python_RuntimeConfig = Unit_Python_RuntimeConfig>
	extends BaseUnit<C, RTC>
	implements UnitPhaseImplementor<[Phase_Install]> {

	protected commando!: CommandoInteractive & Commando & Cli_Basic;

	constructor(config: Unit_Python<C, RTC>['config']) {
		super(config);
		this.addToClassStack(Unit_Python);
		this.commando = CommandoInteractive.create(Cli_Basic);
	}

	protected async init() {
		await super.init();
		this.runtime.pathTo = {
			pkg: convertToFullPath(this.config.pathToPackage),
		};
		await this.initCommando();
	}

	//######################### Internal Logic #########################

	private async initCommando() {
		this.commando
			.setUID(this.config.key)
			.cd(this.runtime.pathTo.pkg)
			.debug();

		//Install & Enter VENV
		await this.commando
			.append('python3 -m venv venv')
			.append('source venv/bin/activate')
			.execute();

		//Set Python Path
		await this.commando.append('export PYTHONPATH=.').execute();
	}

	//######################### Phase Implementation #########################

	async install() {
		await this.commando.append('pip install -r requirements.txt').execute();
	}
}