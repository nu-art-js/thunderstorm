import {Phase_Install} from '../../phase';
import {UnitPhaseImplementor} from '../types';
import {BaseUnit} from './BaseUnit';
import {convertToFullPath} from '@nu-art/commando/shell/tools';
import {Cli_Basic} from '@nu-art/commando/cli/basic';
import {CommandoInteractive} from '@nu-art/commando/shell';


type _Config<C> = {
	pathToPackage: string
} & C

type _RuntimeConfig<RTC> = {
	pathTo: { pkg: string };
} & RTC;

export class Unit_Python<Config extends {} = {}, RuntimeConfig extends {} = {},
	C extends _Config<Config> = _Config<Config>, RTC extends _RuntimeConfig<RuntimeConfig> = _RuntimeConfig<RuntimeConfig>>
	extends BaseUnit<C, RTC>
	implements UnitPhaseImplementor<[Phase_Install]> {

	protected commando!: CommandoInteractive & Cli_Basic;

	constructor(config: Unit_Python<C, RTC>['config']) {
		super(config);
		this.commando = CommandoInteractive.create(Cli_Basic);
	}

	protected async init() {
		await super.init();
		this.runtime.pathTo = {
			pkg: convertToFullPath(this.config.pathToPackage),
		};
		this.logWarning(`Python Path ${this.runtime.pathTo.pkg}`);
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