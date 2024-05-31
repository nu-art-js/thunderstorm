import {Package_Python} from '../../core/types';
import {Commando, CommandoCLIKeyValueListener, CommandoCLIListener, CommandoInteractive} from '@nu-art/commando/core/cli';
import {Cli_Basic} from '@nu-art/commando/cli/basic';
import {convertToFullPath} from '@nu-art/commando/core/tools';

export class CommandExecutor_Python {

	private readonly APP_PID_LOG = '_APP_PID_';
	private readonly APP_KILL_LOG = '_APP_KILLED_';

	private readonly pkg: Package_Python;
	private readonly commando: CommandoInteractive & Commando & Cli_Basic;
	private listeners!: {
		pid: CommandoCLIKeyValueListener;
		kill: CommandoCLIListener;
	};

	constructor(pkg: Package_Python) {
		this.pkg = pkg;
		this.commando = CommandoInteractive.create(Cli_Basic)
			.setUID(this.pkg.name)
			.cd(convertToFullPath(this.pkg.path))
			.debug();
		this.initListeners();
	}

	//######################### Inner Logic #########################

	private initListeners() {
		this.listeners = {
			pid: new CommandoCLIKeyValueListener(new RegExp(`${this.APP_PID_LOG}=(\\d+)`)),
			kill: new CommandoCLIListener(() => this.commando.close(), this.APP_KILL_LOG),
		};
		this.listeners.pid.listen(this.commando);
		this.listeners.kill.listen(this.commando);
	}

	private getPID() {
		const pid = Number(this.listeners.pid.getValue());
		return isNaN(pid) ? undefined : pid;
	}

	private async enterVenv () {
		await this.commando.append('source venv/bin/activate').execute();
	}

	private async setPythonPath () {
		await this.commando.append('export PYTHONPATH=.').execute();
	}

	private async runApp () {
		await this.commando
			.append('python3 app/src/run.py --env=local &')
			.append('pid=$!')
			.append(`echo "${this.APP_PID_LOG}=\${pid}"`)
			.append(`wait \$pid`)
			.append(`echo "${this.APP_KILL_LOG} \${pid}"`)
			.execute();
	}

	private async clearPorts() {
		const emPort = 4450;
		await this.commando
			.append(`array=($(lsof -ti:${[emPort].join(',')}))`)
			.append(`((\${#array[@]} > 0)) && kill -9 "\${array[@]}"`)
			.append('echo ')
			.execute();
	}

	//######################### Functions #########################

	public async execute () {
		await this.clearPorts();
		await this.enterVenv();
		await this.setPythonPath();
		await this.runApp();
	}

	public async kill () {
		const appPid = this.getPID();
		await this.commando.gracefullyKill(appPid);
	}
}