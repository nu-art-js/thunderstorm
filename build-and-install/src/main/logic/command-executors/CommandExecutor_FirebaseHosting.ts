import {NVM} from '@nu-art/commando/cli/nvm';
import {Package_FirebaseHostingApp} from '../../core/types';
import {BadImplementationException} from '@nu-art/ts-common';
import {Cli_Basic} from '@nu-art/commando/cli/basic';
import {CommandoInteractive} from '@nu-art/commando/shell';


export class CommandExecutor_FirebaseHosting {

	private readonly APP_PID_LOG = '_APP_PID_';
	private readonly APP_KILL_LOG = '_APP_KILLED_';

	private readonly pkg: Package_FirebaseHostingApp;
	private readonly commando: CommandoInteractive & Cli_Basic;

	constructor(pkg: Package_FirebaseHostingApp) {
		if (!pkg.envConfig.hostingPort)
			throw new BadImplementationException(`Package ${pkg.name} missing hosting port in envConfig`);

		this.pkg = pkg;
		this.commando = NVM.createInteractiveCommando(Cli_Basic);
		this.initListeners();
	}

	//######################### Inner Logic #########################

	private initListeners() {
	}

	private async clearPorts() {
		await NVM.createCommando(Cli_Basic)
			.setUID(this.pkg.name)
			.debug()
			.append(`array=($(lsof -ti:${[this.pkg.envConfig.hostingPort].join(',')}))`)
			.append(`((\${#array[@]} > 0)) && kill -9 "\${array[@]}"`)
			.append('echo ')
			.execute();
	}

	private async runApp() {
		await this.commando
			.setUID(this.pkg.name)
			.cd(this.pkg.path)
			.append(`npm run start &`)
			.append('pid=$!')
			.append(`echo "${this.APP_PID_LOG}=\${pid}"`)
			.append(`wait \$pid`)
			.append(`echo "${this.APP_KILL_LOG} \${pid}"`)
			.execute();
	}

	//######################### Functions #########################

	public async execute() {
		await this.clearPorts();
		await this.runApp();
		return this;
	}

	public async kill() {
	}
}