import {promises as fs} from 'fs';
import {Logger, LogLevel} from '@nu-art/ts-common';
import {convertToFullPath} from '../tools.js';
import {Commando_PNPM} from '../plugins/pnpm.js';


export class Cli_PNPM
	extends Logger {

	private _expectedVersion = '10.7.0';
	private _homeEnvVar = 'PNPM_HOME';

	constructor() {
		super();
		this.setMinLevel(LogLevel.Verbose);
	}

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

	install = async (commando: Commando_PNPM) => {
		if (this.isInstalled()) {
			const version = (await commando.getVersion());
			if (this._expectedVersion === version)
				return;

			await this.uninstall();
		}

		this.logDebug(`installing PNPM version ${this._expectedVersion}`);
		await commando.install(this._expectedVersion);

		return this;
	};

	isInstalled = () => !!process.env[this._homeEnvVar];
	installPackages = async (commando: Commando_PNPM) => {
		return await commando.installPackages();
	};

	uninstall = async () => {
		this.logDebug('Uninstalling PNPM');
		const absolutePathToPNPM_Home = process.env[this._homeEnvVar];
		if (!absolutePathToPNPM_Home)
			return;
		return fs.rm(absolutePathToPNPM_Home, {recursive: true, force: true});
	};

	/**
	 * Asynchronously creates a workspace file with a list of packages.
	 * Each package is listed under the 'packages:' section in the file.
	 *
	 * @param listOfLibs An array of library names to include in the workspace.
	 * @param pathToWorkspaceFolder The filesystem path where the workspace file will be written.
	 * @example
	 * await createWorkspace(['pack1', 'pack2'], './path/to/workspace.yaml');
	 */
	createWorkspace = async (listOfLibs: string[], pathToWorkspaceFolder: string = process.cwd()): Promise<void> => {
		try {
			let workspace = 'packages:\n';
			listOfLibs.forEach(lib => {
				workspace += `  - '${lib}'\n`;
			});

			const pathToPnpmWorkspace = convertToFullPath('./pnpm-workspace.yaml', pathToWorkspaceFolder);
			await fs.writeFile(pathToPnpmWorkspace, workspace, 'utf8');
			this.logDebug(`Workspace file created at ${pathToPnpmWorkspace}`);
		} catch (error: any) {
			this.logError('Failed to create workspace file:', error);
		}
	};
}

export const PNPM = new Cli_PNPM();