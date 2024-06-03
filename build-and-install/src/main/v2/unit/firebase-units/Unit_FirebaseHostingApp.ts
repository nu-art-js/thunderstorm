import {Unit_TypescriptLib, Unit_TypescriptLib_Config} from '../core';
import {FirebasePackageConfig} from '../../../core/types';
import {UnitPhaseImplementor} from '../types';
import {Phase_DeployFrontend, Phase_Launch, Phase_ResolveConfigs} from '../../phase';
import {RuntimeParams} from '../../../core/params/params';
import {BadImplementationException, ImplementationMissingException} from '@nu-art/ts-common';
import {promises as _fs} from 'fs';
import {CONST_FirebaseJSON, CONST_FirebaseRC} from '../../../core/consts';
import {convertToFullPath} from '@nu-art/commando/core/tools';
import {NVM} from '@nu-art/commando/cli/nvm';
import {Cli_Basic} from '@nu-art/commando/cli/basic';
import {MemKey_ProjectConfig} from '../../phase-runner/RunnerParams';
import {
	Commando,
	CommandoCLIKeyValueListener,
	CommandoCLIListener,
	CommandoInteractive
} from '@nu-art/commando/core/cli';

export type Unit_FirebaseHostingApp_Config = Unit_TypescriptLib_Config & {
	firebaseConfig: FirebasePackageConfig;
	sources?: string[];
};

const CONST_VersionApp = 'version-app.json';

export class Unit_FirebaseHostingApp<C extends Unit_FirebaseHostingApp_Config = Unit_FirebaseHostingApp_Config>
	extends Unit_TypescriptLib<C>
	implements UnitPhaseImplementor<[Phase_ResolveConfigs, Phase_Launch, Phase_DeployFrontend]> {

	private readonly APP_PID_LOG = '_APP_PID_';
	private readonly APP_KILL_LOG = '_APP_KILLED_';

	private launchCommando!: CommandoInteractive & Commando & Cli_Basic;
	private listeners!: {
		pid: CommandoCLIKeyValueListener;
		kill: CommandoCLIListener;
	};

	constructor(config: Unit_FirebaseHostingApp<C>['config']) {
		super(config);
		this.addToClassStack(Unit_FirebaseHostingApp);
	}


	//######################### Phase Implementations #########################

	async resolveConfigs() {
		await this.resolveHostingRC();
		await this.resolveHostingJSON();
		await this.resolveHostingRuntimeConfig();
	}

	async compile() {
		this.setStatus('Compile');
		await this.resolveTSConfig();
		await this.clearOutputDir();
		await this.createAppVersionFile();
		await this.compileImpl();
		this.setStatus('Compiled');
	}

	async launch() {
		this.setStatus('Launching');
		await this.initLaunch();
		await this.initLaunchListeners();
		await this.clearPorts();
		await this.runApp();
	}

	async deployFrontend() {
		await this.deployImpl();
	}

	//######################### ResolveConfig Logic #########################

	private getEnvConfig() {
		const env = RuntimeParams.environment;
		const envConfig = this.config.firebaseConfig.envs.find(_env => _env.env === env);
		if (!envConfig)
			throw new ImplementationMissingException(`Missing EnvConfig for env ${env} in unit ${this.config.label}`);

		return envConfig;
	}

	private async resolveHostingRC() {
		const envConfig = this.getEnvConfig();
		const rcConfig = {projects: {default: envConfig.projectId}};
		const targetPath = `${this.runtime.pathTo.pkg}/${CONST_FirebaseRC}`;
		await _fs.writeFile(targetPath, JSON.stringify(rcConfig, null, 2), {encoding: 'utf-8'});
	}

	private async resolveHostingJSON() {
		const envConfig = this.getEnvConfig();
		const fileContent: FirebasePackageConfig['hosting'] = envConfig.isLocal ? {} as FirebasePackageConfig['hosting'] : this.config.firebaseConfig.hosting;
		const targetPath = `${this.runtime.pathTo.pkg}/${CONST_FirebaseJSON}`;
		await _fs.writeFile(targetPath, JSON.stringify({hosting: fileContent}, null, 2), {encoding: 'utf-8'});
	}

	private async resolveHostingRuntimeConfig() {
		const envConfig = this.getEnvConfig();

		const emulatorConfig = {
			hostname: 'localhost',
			port: this.config.firebaseConfig.basePort + 2,
		};

		const feConfig = {
			ModuleFE_Thunderstorm: {
				appName: `${this.config.key} - (${envConfig.env})`
			},
			ModuleFE_XHR: {
				origin: envConfig.isLocal ? `https://localhost:${this.config.firebaseConfig.basePort}` : envConfig.backend.url,
				timeout: envConfig.backend.timeout || 30000,
				compress: envConfig.backend.compress || false,
				minLogLevel: envConfig.backend.minLogLevel || false,
			},
			ModuleFE_FirebaseListener: {
				emulatorConfig: envConfig.isLocal ? emulatorConfig : undefined,
				firebaseConfig: envConfig.firebase.listener?.config
			}
		};

		const targetPath = convertToFullPath(`${this.config.pathToPackage}/src/main/config.ts`);
		const fileContent = `export const config = ${JSON.stringify(feConfig, null, 2)};`;
		await _fs.writeFile(targetPath, fileContent, {encoding: 'utf-8'});
	}

	//######################### Compile Logic #########################

	protected async compileImpl() {
		await NVM
			.createCommando(Cli_Basic)
			.cd(this.runtime.pathTo.pkg)
			.append(`ENV=${RuntimeParams.environment} npm run build`)
			.execute();
	}

	private async createAppVersionFile() {
		//Writing the file to the package source instead of the output is fine,
		//Webpack bundles files into the output automatically!
		const targetPath = `${this.runtime.pathTo.pkg}/src/main/${CONST_VersionApp}`;
		const appVersion = MemKey_ProjectConfig.get().projectVersion;
		const fileContent = JSON.stringify({version: appVersion}, null, 2);
		await _fs.writeFile(targetPath, fileContent, {encoding: 'utf-8'});
	}

	//######################### Launch Logic #########################

	private async initLaunch() {
		if (!this.config.firebaseConfig.hostingPort)
			throw new BadImplementationException(`Unit ${this.config.label} missing hosting port in firebaseConfig`);

		this.launchCommando = NVM.createInteractiveCommando(Cli_Basic)
			.setUID(this.config.key)
			.cd(this.runtime.pathTo.pkg);
	}

	private async initLaunchListeners() {
		this.listeners = {
			pid: new CommandoCLIKeyValueListener(new RegExp(`${this.APP_PID_LOG}=(\\d+)`)),
			kill: new CommandoCLIListener(() => this.launchCommando.close(), this.APP_KILL_LOG),
		};
		this.listeners.pid.listen(this.launchCommando);
		this.listeners.kill.listen(this.launchCommando);
	}

	private getPID() {
		const pid = Number(this.listeners.pid.getValue());
		return isNaN(pid) ? undefined : pid;
	}

	private async clearPorts() {
		await this.launchCommando
			.debug()
			.append(`array=($(lsof -ti:${[this.config.firebaseConfig.hostingPort].join(',')}))`)
			.append(`((\${#array[@]} > 0)) && kill -9 "\${array[@]}"`)
			.append('echo ')
			.execute();
	}

	private async runApp() {
		await this.launchCommando
			.append(`npm run start &`)
			.append('pid=$!')
			.append(`echo "${this.APP_PID_LOG}=\${pid}"`)
			.append(`wait \$pid`)
			.append(`echo "${this.APP_KILL_LOG} \${pid}"`)
			.execute();
	}

	public async kill() {
		if (!this.launchCommando)
			return;

		this.logWarning(`Killing unit - ${this.config.label}`);
		const appPid = this.getPID();
		await this.launchCommando?.gracefullyKill(appPid);
		this.logWarning(`Unit killed - ${this.config.label}`);
	}

	//######################### Deploy Logic #########################

	private async deployImpl() {
		await NVM.createCommando(Cli_Basic)
			.cd(this.runtime.pathTo.pkg)
			.append(`firebase --debug deploy --only hosting`)
			.execute();
	}
}