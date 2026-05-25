import {Commando_NVM, CommandoException} from '@nu-art/commando';
import {Unit_HostingApp, Unit_HostingApp_Config} from './Unit_HostingApp.js';

/**
 * Firebase Hosting application unit (Vite bundler).
 * Extends Unit_HostingApp; implements compile via vite build, launch via vite (dev server).
 */
export class Unit_ViteHostingApp<C extends Unit_HostingApp_Config = Unit_HostingApp_Config>
	extends Unit_HostingApp<C> {

	constructor(config: Unit_ViteHostingApp<C>['config']) {
		super(config);
		this.addToClassStack(Unit_ViteHostingApp);
	}

	protected async compileImpl() {
		const commando = this.allocateCommando(Commando_NVM).applyNVM()
			.cd(this.config.fullPath);

		await this.executeAsyncCommando(commando, `${this.npmCommand('vite')} build`, (stdout, stderr, exitCode) => {
			if (exitCode > 0)
				throw new CommandoException(`Vite build failed`, stdout, stderr, exitCode);
		});
	}

	protected async runApp() {
		const commando = this.allocateCommando(Commando_NVM).applyNVM()
			.setUID(this.config.key)
			.cd(this.config.fullPath);

		const port = this.config.servingPort;
		await this.executeAsyncCommando(commando, `PORT=${port} ${this.npmCommand('vite')}`);
		this.logWarning('HOSTING TERMINATED');
	}
}
