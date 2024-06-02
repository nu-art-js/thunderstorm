import {NVM} from '@nu-art/commando/cli/nvm';
import {Cli_Basic} from '@nu-art/commando/cli/basic';
import {Second, sleep} from '@nu-art/ts-common';
import {Package_FirebaseFunctionsApp} from '../../core/types';
import {RuntimeParams} from '../../core/params/params';
import {CommandoInteractive} from '@nu-art/commando/shell';


type OnReadyCallback = (pkg: Package_FirebaseFunctionsApp) => Promise<void>

export class CommandExecutor_FirebaseFunction {

	static staggerCount: number = 0;

	private readonly PROXY_PID_LOG = '_PROXY_PID_';
	private readonly PROXY_KILL_LOG = '_PROXY_KILLED_';
	private readonly EMULATOR_PID_LOG = '_EMULATOR_PID_';
	private readonly EMULATOR_KILL_LOG = '_EMULATOR_KILLED_';

	private readonly pkg: Package_FirebaseFunctionsApp;
	private readonly commandos: {
		emulator: CommandoInteractive & Cli_Basic;
		proxy: CommandoInteractive & Cli_Basic
	};
	private onReadyCallbacks: OnReadyCallback[] = [];

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
			.append(`firebase emulators:start --export-on-exit --import=.trash/data ${RuntimeParams.debugBackend ? `--inspect-functions ${this.pkg.envConfig.debugPort}` : ''} &`)
			.append('pid=$!')
			.append(`echo "${this.EMULATOR_PID_LOG}=\${pid}"`)
			.append(`wait \$pid`)
			.append(`echo "${this.EMULATOR_KILL_LOG} \${pid}"`)
			.execute();
	}

	//######################### Functions #########################

	public async execute() {
		await sleep(2 * Second * CommandExecutor_FirebaseFunction.staggerCount++);
		await this.clearPorts();
		await this.runProxy();
		await this.runEmulator();
		return this;
	}

	public async kill() {
	}

	public addOnReadyCallback(cb: OnReadyCallback) {
		this.onReadyCallbacks.push(cb);
	}
}