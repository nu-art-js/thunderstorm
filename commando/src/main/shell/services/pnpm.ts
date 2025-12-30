import {promises as fs} from 'fs';
import {Logger, LogLevel} from '@nu-art/ts-common';
import {convertToFullPath} from '../tools.js';
import {Commando_PNPM} from '../plugins/pnpm.js';


/**
 * PNPM package manager service for managing PNPM installations.
 * 
 * Handles installation, version management, and package operations.
 * Works with Commando_PNPM plugin to execute PNPM commands.
 * 
 * **Features**:
 * - Install/uninstall PNPM
 * - Version management
 * - Package installation
 * - Environment variable configuration
 */
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

	/**
	 * Installs PNPM with the expected version.
	 * 
	 * Checks if PNPM is already installed with the expected version.
	 * Uninstalls and reinstalls if version mismatch.
	 * 
	 * @param commando - Commando_PNPM instance to use for installation
	 * @returns This instance for method chaining
	 */
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

	/**
	 * Checks if PNPM is installed.
	 * 
	 * Verifies environment variable is set.
	 * 
	 * @returns True if PNPM_HOME environment variable is set
	 */
	isInstalled = () => !!process.env[this._homeEnvVar];

	/**
	 * Installs packages using PNPM.
	 * 
	 * Delegates to Commando_PNPM.installPackages().
	 * 
	 * @param commando - Commando_PNPM instance to use
	 * @returns Promise that resolves when packages are installed
	 */
	installPackages = async (commando: Commando_PNPM) => {
		return await commando.installPackages();
	};

	/**
	 * Uninstalls PNPM by removing its home directory.
	 * 
	 * @returns Promise that resolves when uninstall completes
	 */
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