import {LogLevel} from '@nu-art/ts-common';
import {Commando_Basic, Commando_NVM, CommandoException} from '@nu-art/commando';
import {UnitConfigJSON_Node} from '../../discovery/resolvers/UnitMapper_Node.js';
import {
	FirebaseHosting_EnvConfig,
	FirebaseHostingConfig,
	Unit_HostingApp,
	Unit_HostingApp_Config
} from './Unit_HostingApp.js';

export type {FirebaseHostingConfig, FirebaseHosting_EnvConfig};

export type UnitConfigJSON_FirebaseHosting = UnitConfigJSON_Node & {
	servingPort?: number,
	hostingConfig?: FirebaseHostingConfig
	envs: import('@nu-art/ts-common').TypedMap<FirebaseHosting_EnvConfig>
};

export type Unit_FirebaseHostingApp_Config = Unit_HostingApp_Config;

/**
 * Firebase Hosting application unit (webpack bundler).
 * Extends Unit_HostingApp; implements compile via npm run build, launch via npm run start.
 */
export class Unit_FirebaseHostingApp<C extends Unit_FirebaseHostingApp_Config = Unit_FirebaseHostingApp_Config>
	extends Unit_HostingApp<C> {

	static DefaultConfig_FirebaseHosting = Unit_HostingApp.DefaultConfig_Hosting;

	constructor(config: Unit_FirebaseHostingApp<C>['config']) {
		super(config);
		this.addToClassStack(Unit_FirebaseHostingApp);
	}

	protected async compileImpl() {
		const commando = this.allocateCommando(Commando_NVM, Commando_Basic).applyNVM()
			.cd(this.config.fullPath);

		await this.executeAsyncCommando(commando, `ENV=${this.runtimeContext.runtimeParams.environment} npm run build`, (stdout, stderr, exitCode) => {
			if (exitCode > 0)
				throw new CommandoException(`Error compiling`, stdout, stderr, exitCode);
		});
	}

	protected async runApp() {
		const commando = this.allocateCommando(Commando_NVM).applyNVM()
			.setUID(this.config.key)
			.cd(this.config.fullPath)
			.setLogLevelFilter((log) => {
				if (log.toLowerCase().includes('<i>'))
					return LogLevel.Info;
			});

		await this.executeAsyncCommando(commando, 'npm run start');
		this.logWarning('HOSTING TERMINATED');
	}
}
