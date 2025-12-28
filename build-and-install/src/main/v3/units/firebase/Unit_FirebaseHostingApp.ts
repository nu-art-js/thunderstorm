import {FirebasePackageConfig} from '../../../core/types/index.js';
import {UnitPhaseImplementor} from '../../core/types.js';
import {ImplementationMissingException, LogLevel, StringMap, TS_Object, TypedMap} from '@nu-art/ts-common';
import {CONST_FirebaseJSON, CONST_FirebaseRC, CONST_VersionApp} from '../../../core/consts.js';
import {Commando_NVM} from '@nu-art/commando/shell/plugins/nvm';
import {Commando_Basic} from '@nu-art/commando/shell/plugins/basic';
import {UnitConfigJSON_Node} from '../../UnitsMapper/resolvers/UnitMapper_Node.js';
import {resolve} from 'path';
import {Phase_Deploy, Phase_Launch} from '../../phase/index.js';
import {Unit_TypescriptLib, Unit_TypescriptLib_Config} from '../Unit_TypescriptLib.js';
import {CommandoException} from '@nu-art/commando/shell/core/CliError';
import {deployLogFilter} from './common.js';
import {FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';


export type FirebaseHostingConfig = {
	public: string
	rewrites: {
		source: string
		destination: string
	}[]
};

export type FirebaseHosting_EnvConfig = {
	config: TS_Object,
	projectId: string,
	isLocal?: boolean
};
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

export class Unit_FirebaseHostingApp<C extends Unit_FirebaseHostingApp_Config = Unit_FirebaseHostingApp_Config>
	extends Unit_TypescriptLib<C>
	implements UnitPhaseImplementor<[Phase_Launch, Phase_Deploy]> {

	public hosting: StringMap = {};

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
		if (!this.config.envConfig.projectId.length) {
			this.logWarning('envConfig: ', this.config.envConfig);
			throw new ImplementationMissingException(`Missing EnvConfig in unit ${this.config.key}`);
		}

		await super.prepare();
		await this.resolveHostingRC();
		await this.resolveHostingJSON();
		await this.resolveHostingRuntimeConfig();
	}

	async compile() {
		await this.resolveTSConfig(resolve(this.config.fullPath, './src'), 'main', {compilerOptions: {declaration: false}});
		await this.clearOutputDir();
		await this.createAppVersionFile();
		await this.compileImpl();
	}

	async launch() {
		this.setStatus('Launching');
		await this.releaseWebpackPorts();
		await this.runApp();
	}

	async releaseWebpackPorts() {
		return this.releasePorts([`${this.config.servingPort}`]);
	}

	async deploy() {
		const commando = this.allocateCommando(Commando_NVM).applyNVM()
			.cd(this.config.fullPath)
			.setLogLevelFilter(deployLogFilter)
			// example: Function URL (hello(us-central1)): https://hello-kv65k7yylq-uc.a.run.app
			.onLog(/.*Hosting URL.*(https:\/\/.*?)$/, match => {
				this.hosting[match[1]] = match[2];
			});

		const debug = this.runtimeContext.runtimeParams.verbose ? ' --debug' : '';
		await this.executeAsyncCommando(commando, `${this.npmCommand('firebase')}${debug} deploy --only hosting`, (stdout, stderr, exitCode) => {
			if (exitCode === 0)
				return;

			throw new CommandoException(`Failed to deploy hosting with exit code ${exitCode}`, stdout, stderr, exitCode);
		});
	}

	//######################### ResolveConfig Logic #########################

	private async resolveHostingRC() {
		const envConfig = this.config.envConfig;
		const rcConfig = {projects: {default: envConfig.projectId}};
		const targetPath = `${this.config.fullPath}/${CONST_FirebaseRC}`;
		await FileSystemUtils.file.write.json(targetPath, rcConfig);
	}


	private async resolveHostingJSON() {
		const envConfig = this.config.envConfig;
		const targetPath = `${this.config.fullPath}/${CONST_FirebaseJSON}`;
		let fileContent: any;

		if (envConfig.isLocal)
			fileContent = {};
		else
			fileContent = {
				hosting: this.config.hostingConfig ?? {
					'public': 'dist',
					'rewrites': [
						{'source': '**', 'destination': '/index.html'}
					]
				}
			};

		await FileSystemUtils.file.write.json(targetPath, fileContent);
	}

	private async resolveHostingRuntimeConfig() {
		const envConfig = this.config.envConfig.config;
		const targetPath = resolve(this.config.fullPath, `./src/main/config.ts`);
		const fileContent = `export const config = ${JSON.stringify(envConfig, null, 2)};`;
		await FileSystemUtils.file.write(targetPath, fileContent);
	}

	//######################### Compile Logic #########################

	protected async compileImpl() {
		const commando = this.allocateCommando(Commando_NVM, Commando_Basic).applyNVM()
			.cd(this.config.fullPath);

		await this.executeAsyncCommando(commando, `ENV=${this.runtimeContext.runtimeParams.environment} npm run build`, (stdout, stderr, exitCode) => {
			if (exitCode > 0)
				throw new CommandoException(`Error compiling`, stdout, stderr, exitCode);
		});
	}

	private async createAppVersionFile() {
		//Writing the file to the package source instead of the output is fine,
		//Webpack bundles files into the output automatically!
		const targetPath = `${this.config.fullPath}/src/main/${CONST_VersionApp}`;
		const appVersion = this.runtimeContext.version;
		await FileSystemUtils.file.write.json(targetPath, {version: appVersion});
	}

	//######################### Launch Logic #########################

	private async runApp() {
		const commando = this.allocateCommando(Commando_NVM).applyNVM()
			.setUID(this.config.key)
			.cd(this.config.fullPath)
			.setLogLevelFilter((log, type) => {
				if (log.toLowerCase().includes('<i>'))
					return LogLevel.Info;
			});

		await this.executeAsyncCommando(commando, 'npm run start');
		this.logWarning('HOSTING TERMINATED');
	}
}
