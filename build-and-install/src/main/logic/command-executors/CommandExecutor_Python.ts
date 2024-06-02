import {Package_Python} from '../../core/types';
import {Cli_Basic} from '@nu-art/commando/cli/basic';
import {convertToFullPath} from '@nu-art/commando/shell/tools';
import {CommandoInteractive} from '@nu-art/commando/shell';


export class CommandExecutor_Python {

	private readonly APP_PID_LOG = '_APP_PID_';
	private readonly APP_KILL_LOG = '_APP_KILLED_';

	private readonly pkg: Package_Python;
	private readonly commando;

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
	}

	private async enterVenv() {
		await this.commando.append('source venv/bin/activate').execute();
	}

	private async setPythonPath() {
		await this.commando.append('export PYTHONPATH=.').execute();
	}

	private async runApp() {
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

	public async execute() {
		await this.clearPorts();
		await this.enterVenv();
		await this.setPythonPath();
		await this.runApp();
	}

	public async kill() {
	}
}