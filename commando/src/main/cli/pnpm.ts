import {MergeClass} from '../core/class-merger';
import {Cli_Programming} from './programming';
import {Cli_Basic} from './basic';
import {Commando} from '../core/cli';
import * as fs from 'fs';
import * as path from 'path';


export class Cli_PNPM {

	private _expectedVersion = '8.15.5';
	private _homeEnvVar = 'PNPM_HOME';

	get homeEnvVar(): string {
		return this._homeEnvVar;
	}

	set homeEnvVar(value: string) {
		this._homeEnvVar = value;
	}

	get expectedVersion() {
		return this._expectedVersion;
	}

	set expectedVersion(value) {
		this._expectedVersion = value;
	}

	install = async (commando?: Commando) => {
		if (this.isInstalled()) {
			const version = (await this.getVersion()).stdout.trim();
			if (this._expectedVersion === version)
				return;

			await this.uninstall();
		}

		console.log(`installing PNPM version ${this._expectedVersion}`);
		await (commando ?? Commando.create())
			.append(`curl -fsSL "https://get.pnpm.io/install.sh" | env PNPM_VERSION=${this._expectedVersion} sh -`)
			.execute();

		return this;
	};

	isInstalled = () => !!process.env[this._homeEnvVar];

	installPackages = async (commando?: Commando) => {
		await (commando ?? Commando.create())
			.append(`pnpm install -f --no-frozen-lockfile`)
			.execute();

		return this;
	};

	private async getVersion() {
		const commando = Commando.create(Cli_Programming, Cli_Basic);
		return commando.if('[[ -x "$(command -v pnpm)" ]]', (commando) => {
			commando.cli.append('pnpm --version');
		}).execute();
	}

	uninstall = async () => {
		console.log('Uninstalling PNPM');
		const absolutePathToPNPM_Home = process.env[this._homeEnvVar];
		fs.rmSync(absolutePathToPNPM_Home, {recursive: true, force: true});
	};
}

export const PNPM = new Cli_PNPM();