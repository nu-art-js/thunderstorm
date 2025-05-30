import {Unit_TypescriptLib, Unit_TypescriptLib_Config} from '../index';
import {FirebasePackageConfig} from '../../../core/types';
import {UnitPhaseImplementor} from '../../core/types';
import {ImplementationMissingException, LogLevel, TypedMap} from '@nu-art/ts-common';
import {promises as _fs} from 'fs';
import {CONST_FirebaseJSON, CONST_FirebaseRC} from '../../../core/consts';
import {Commando_NVM} from '@nu-art/commando/shell/plugins/nvm';
import {Commando_Basic} from '@nu-art/commando/shell/plugins/basic';
import {UnitConfigJSON_Node} from '../../UnitsMapper/resolvers/UnitMapper_Node';
import {resolve} from 'path';
import {Phase_DeployFrontend, Phase_Launch} from '../../phase';


export type FirebaseHostingConfig = {
	public: string
	rewrites: {
		source: string
		destination: string
	}[]
};

export type FirebaseHosting_EnvConfig = { configUrl: string, projectId: string, isLocal?: boolean };
export type UnitConfigJSON_FirebaseHosting = UnitConfigJSON_Node & {
	servingPort?: number,
	hostingConfig?: FirebaseHostingConfig
	envs: TypedMap<FirebaseHosting_EnvConfig>
};

export type Unit_FirebaseHostingApp_Config = Unit_TypescriptLib_Config & {
	firebaseConfig?: FirebasePackageConfig;
	servingPort: number
	hostingConfig?: FirebaseHostingConfig
	envConfig: FirebaseHosting_EnvConfig
	sources?: string[];
};

const CONST_VersionApp = 'version-app.json';

export class Unit_FirebaseHostingApp<C extends Unit_FirebaseHostingApp_Config = Unit_FirebaseHostingApp_Config>
	extends Unit_TypescriptLib<C>
	implements UnitPhaseImplementor<[Phase_Launch, Phase_DeployFrontend]> {

	static DefaultConfig_FirebaseHosting = {
		servingPort: 8100,
		output: 'dist',
	};

	constructor(config: Unit_FirebaseHostingApp<C>['config']) {
		super(config);
		this.addToClassStack(Unit_FirebaseHostingApp);
	}

	//######################### Phase Implementations #########################

	async prepare() {
		await super.prepare();
		await this.resolveHostingRC();
		await this.resolveHostingJSON();
		await this.resolveHostingRuntimeConfig();
	}

	async compile() {
		await this.resolveTSConfig(resolve(this.config.fullPath, './src'), 'main');
		await this.clearOutputDir();
		await this.createAppVersionFile();
		await this.compileImpl();
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
		const envConfig = this.config.envConfig;
		if (!envConfig)
			throw new ImplementationMissingException(`Missing EnvConfig in unit ${this.config.label}`);

		return envConfig;
	}

	private async resolveHostingRC() {
		const envConfig = this.getEnvConfig();
		const rcConfig = {projects: {default: envConfig.projectId}};
		const targetPath = `${this.config.fullPath}/${CONST_FirebaseRC}`;
		await _fs.writeFile(targetPath, JSON.stringify(rcConfig, null, 2), {encoding: 'utf-8'});
	}

	private async resolveHostingJSON() {
		const envConfig = this.getEnvConfig();
		const targetPath = `${this.config.fullPath}/${CONST_FirebaseJSON}`;
		let fileContent: any;

		if (envConfig.isLocal)
			fileContent = {};
		else
			fileContent = {hosting: this.config.hostingConfig};

		await _fs.writeFile(targetPath, JSON.stringify(fileContent, null, 2), {encoding: 'utf-8'});
	}

	private async resolveHostingRuntimeConfig() {
		const envConfig = {
			configUrl: this.getEnvConfig().configUrl,
		};
		const targetPath = resolve(this.config.fullPath, `./src/main/config.ts`);
		const fileContent = `export const config = ${JSON.stringify(envConfig, null, 2)};`;
		await _fs.writeFile(targetPath, fileContent, {encoding: 'utf-8'});
	}

	//######################### Compile Logic #########################

	protected async compileImpl() {
		const commando = this.allocateCommando(Commando_NVM, Commando_Basic).applyNVM()
			.cd(this.config.fullPath);

		await this.executeAsyncCommando(commando, `ENV=${this.runtimeContext.runtimeParams.environment} npm run build`);
	}

	private async createAppVersionFile() {
		//Writing the file to the package source instead of the output is fine,
		//Webpack bundles files into the output automatically!
		const targetPath = `${this.config.fullPath}/src/main/${CONST_VersionApp}`;
		const appVersion = this.runtimeContext.baiConfig.appVersion;
		const fileContent = JSON.stringify({version: appVersion}, null, 2);
		await _fs.writeFile(targetPath, fileContent, {encoding: 'utf-8'});
	}

	//######################### Launch Logic #########################

	private async runApp() {
		const commando = this.allocateCommando(Commando_NVM).applyNVM()
			.setUID(this.config.key)
			.cd(this.config.fullPath)
			.setLogLevelFilter((log, type) => {
				if (log.toLowerCase().includes('<i>'))
					return LogLevel.Info;
			})
			.append(`array=($(lsof -ti:${[this.config.servingPort].join(',')}))`)
			.append(`((\${#array[@]} > 0)) && kill -9 "\${array[@]}"`)
			.append('echo ');

		await this.executeAsyncCommando(commando, 'npm run start');
		this.logWarning('HOSTING TERMINATED');
	}

	//######################### Deploy Logic #########################

	private async deployImpl() {
		const commando = this.allocateCommando(Commando_NVM).applyNVM()
			.cd(this.config.fullPath);

		return this.executeAsyncCommando(commando, `firebase --debug deploy --only hosting`);
	}
}
