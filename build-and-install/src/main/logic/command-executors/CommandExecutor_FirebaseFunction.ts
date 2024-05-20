import {NVM} from '@nu-art/commando/cli/nvm';
import {Cli_Basic} from '@nu-art/commando/cli/basic';
import {Commando, CommandoCLIKeyValueListener, CommandoCLIListener, CommandoInteractive} from '@nu-art/commando/core/cli';
import {Second, sleep} from '@nu-art/ts-common';
import {Package_FirebaseFunctionsApp} from '../../core/types';

type CommandExecutor_FirebaseFunction_Listeners = {
	proxy: {
		pid: CommandoCLIKeyValueListener;
		kill: CommandoCLIListener;
	};
	emulator: {
		pid: CommandoCLIKeyValueListener;
		kill: CommandoCLIListener;
	};
}

export class CommandExecutor_FirebaseFunction {

	static staggerCount: number = 0;

	private readonly PROXY_PID_LOG = '_PROXY_PID_';
	private readonly PROXY_KILL_LOG = '_PROXY_KILLED_';
	private readonly EMULATOR_PID_LOG = '_EMULATOR_PID_';
	private readonly EMULATOR_KILL_LOG = '_EMULATOR_KILLED_';

	private readonly pkg: Package_FirebaseFunctionsApp;
	private readonly commandos: {
		emulator: CommandoInteractive & Commando & Cli_Basic;
		proxy: CommandoInteractive & Commando & Cli_Basic
	};
	private listeners!: CommandExecutor_FirebaseFunction_Listeners;
	private debugMode?: boolean;

	constructor(pkg: Package_FirebaseFunctionsApp) {
		this.pkg = pkg;
		this.commandos = {
			emulator: NVM.createInteractiveCommando(Cli_Basic),
			proxy: NVM.createInteractiveCommando(Cli_Basic),
		};
		this.initListeners();
	}

	//######################### Inner Logic #########################

	private initListeners() {
		this.listeners = {
			proxy: {
				pid: new CommandoCLIKeyValueListener(new RegExp(`${this.PROXY_PID_LOG}=(\\d+)`)),
				kill: new CommandoCLIListener(() => this.commandos.proxy.close(), this.PROXY_KILL_LOG),
			},
			emulator: {
				pid: new CommandoCLIKeyValueListener(new RegExp(`${this.EMULATOR_PID_LOG}=(\\d+)`)),
				kill: new CommandoCLIListener(() => this.commandos.emulator.close(), this.EMULATOR_KILL_LOG),
			}
		};
		this.listeners.proxy.kill.listen(this.commandos.proxy);
		this.listeners.proxy.pid.listen(this.commandos.proxy);
		this.listeners.emulator.kill.listen(this.commandos.emulator);
		this.listeners.emulator.pid.listen(this.commandos.emulator);
	}

	private async clearPorts() {
		const allPorts = Array.from({length: 10}, (_, i) => `${this.pkg.envConfig.basePort + i}`);
		await NVM.createCommando(Cli_Basic)
			.setUID(this.pkg.name)
			.debug()
			.append(`array=($(lsof -ti:${allPorts.join(',')}))`)
			.append(`((\${#array[@]} > 0)) && kill -9 "\${array[@]}"`)
			.append('echo ')
			.execute();
	}

	private async runProxy() {
		await this.commandos.proxy
			.setUID(this.pkg.name)
			.cd(this.pkg.path)
			.append('ts-node src/main/proxy.ts &')
			.append('pid=$!')
			.append(`echo "${this.PROXY_PID_LOG}=\${pid}"`)
			.append(`wait \$pid`)
			.append(`echo "${this.PROXY_KILL_LOG} \${pid}"`)
			.execute();
	}

	private async runEmulator() {
		await this.commandos.emulator
			.setUID(this.pkg.name)
			.cd(this.pkg.path)
			.append(`firebase emulators:start --export-on-exit --import=.trash/data ${this.debugMode ? `--inspect-functions ${this.pkg.envConfig.ssl}` : ''} &`)
			.append('pid=$!')
			.append(`echo "${this.EMULATOR_PID_LOG}=\${pid}"`)
			.append(`wait \$pid`)
			.append(`echo "${this.EMULATOR_KILL_LOG} \${pid}"`)
			.execute();
	}

	private getPID(listener: CommandoCLIKeyValueListener) {
		const pid = Number(listener.getValue());
		return isNaN(pid) ? undefined : pid;
	}

	//######################### Functions #########################

	public async execute() {
		await sleep(Second * CommandExecutor_FirebaseFunction.staggerCount++);
		await this.clearPorts();
		await this.runProxy();
		await this.runEmulator();
		return this;
	}

	public async kill() {
		const emulatorPid = this.getPID(this.listeners.emulator.pid);
		const proxyPid = this.getPID(this.listeners.proxy.pid);
		await this.commandos.emulator.gracefullyKill(emulatorPid);
		await this.commandos.proxy.gracefullyKill(proxyPid);
	}

	public setDebug(debug: boolean) {
		this.debugMode = debug;
	}
}