import {Unit_TypescriptLib, Unit_TypescriptLib_Config} from '../core';
import {FirebasePackageConfig} from '../../../core/types';
import {UnitPhaseImplementor} from '../types';
import {Phase_DeployFrontend, Phase_Launch, Phase_ResolveConfigs} from '../../phase';
import {RuntimeParams} from '../../../core/params/params';
import {BadImplementationException, ImplementationMissingException} from '@nu-art/ts-common';
import {promises as _fs} from 'fs';
import {CONST_FirebaseJSON, CONST_FirebaseRC} from '../../../core/consts';
import {MemKey_ProjectConfig} from '../../phase-runner/RunnerParams';
import {convertToFullPath} from '@nu-art/commando/shell/tools';
import {dispatcher_WatchEvent} from '../runner-dispatchers';
import {Commando_NVM} from '@nu-art/commando/shell/plugins/nvm';
import {Commando_Basic} from '@nu-art/commando/shell/plugins/basic';


export type Unit_FirebaseHostingApp_Config = Unit_TypescriptLib_Config & {
	firebaseConfig: FirebasePackageConfig;
	sources?: string[];
};

const CONST_VersionApp = 'version-app.json';

export class Unit_FirebaseHostingApp<C extends Unit_FirebaseHostingApp_Config = Unit_FirebaseHostingApp_Config>
	extends Unit_TypescriptLib<C>
	implements UnitPhaseImplementor<[Phase_ResolveConfigs, Phase_Launch, Phase_DeployFrontend]> {

	constructor(config: Unit_FirebaseHostingApp<C>['config']) {
		super(config);
		this.addToClassStack(Unit_FirebaseHostingApp);
		dispatcher_WatchEvent.removeListener(this);
	}

	protected async init(setInitialized: boolean = true): Promise<void> {
		await super.init(setInitialized);

		if (!this.config.firebaseConfig.hostingPort)
			throw new BadImplementationException(`Unit ${this.config.label} missing hosting port in firebaseConfig`);
	}

	//######################### Phase Implementations #########################

	async resolveConfigs() {
		await this.resolveHostingRC();
		await this.resolveHostingJSON();
		await this.resolveHostingRuntimeConfig();
	}

	async compile() {
		this.setStatus('Compiling', 'start');
		await this.resolveTSConfig();
		await this.clearOutputDir();
		await this.createAppVersionFile();
		await this.compileImpl();
		this.setStatus('Compiled', 'end');
	}

	async launch() {
		this.setStatus('Launching');
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
		const targetPath = `${this.runtime.pathTo.pkg}/${CONST_FirebaseJSON}`;
		let fileContent: any;

		if (envConfig.isLocal)
			fileContent = {};
		else
			fileContent = {hosting: this.config.firebaseConfig.hosting};

		await _fs.writeFile(targetPath, JSON.stringify(fileContent, null, 2), {encoding: 'utf-8'});
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
		const commando = this.allocateCommando(Commando_NVM, Commando_Basic).applyNVM()
			.cd(this.runtime.pathTo.pkg)
			.append(`ENV=${RuntimeParams.environment} npm run build`);

		await this.executeAsyncCommando(commando);
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

	private async runApp() {
		const commando = this.allocateCommando(Commando_NVM).applyNVM()
			.setUID(this.config.key)
			.cd(this.runtime.pathTo.pkg)
			.append(`array=($(lsof -ti:${[this.config.firebaseConfig.hostingPort].join(',')}))`)
			.append(`((\${#array[@]} > 0)) && kill -9 "\${array[@]}"`)
			.append('echo ')
			.append('npm run start');

		return this.executeAsyncCommando(commando);
	}

	//######################### Deploy Logic #########################

	private async deployImpl() {
		const commando = this.allocateCommando(Commando_NVM).applyNVM()
			.cd(this.runtime.pathTo.pkg)
			.append(`firebase --debug deploy --only hosting`);

		return this.executeAsyncCommando(commando);
	}
}