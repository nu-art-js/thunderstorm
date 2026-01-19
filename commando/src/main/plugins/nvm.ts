import {BaseCommando} from '../core/BaseCommando.js';
import {Commando_Programming} from './programming.js';
import {MergeClass} from '../core/class-merger.js';
import {Commando_Basic} from './basic.js';
import {Exception, filterDuplicates} from '@nu-art/ts-common';
import {removeAnsiCodes} from '../tools.js';


const Super = MergeClass(BaseCommando, Commando_Programming, Commando_Basic);

/**
 * NVM (Node Version Manager) plugin for Commando.
 * 
 * Provides NVM operations for managing Node.js versions:
 * - Install NVM
 * - Apply NVM to shell session
 * - Install specific Node.js versions
 * - Get installed Node.js versions
 * 
 * Extends Commando_Programming and Commando_Basic (merged).
 */
export class Commando_NVM
	extends Super {

	/**
	 * Applies NVM to the shell session.
	 * 
	 * Exports NVM_DIR, sources nvm.sh, and runs `nvm use`.
	 * Must be called before using NVM commands in an interactive shell.
	 * 
	 * @returns This instance for method chaining
	 */
	applyNVM(): this {
		this.append('export NVM_DIR="$HOME/.nvm"')
			.append('[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm')
			.append('nvm use');

		return this;
	}

	/**
	 * Installs NVM by downloading and executing the install script.
	 * 
	 * @param version - NVM version to install
	 * @returns This instance for method chaining
	 * @throws Exception if installation fails (non-zero exit code)
	 */
	async install(version: string) {
		this.append(`curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/v${version}/install.sh" | bash`);
		await this.execute((stdout, stderr, exitCode) => {
			if (exitCode !== 0)
				throw new Exception(`Error installing NVM - exit code (${exitCode})`);
		});
		return this;
	}

	/**
	 * Gets the installed NVM version.
	 * 
	 * Only executes if NVM is available (checks with `command -v nvm`).
	 * 
	 * @returns Promise resolving to NVM version string
	 */
	async getVersion() {
		return this.if('[[ -x "$(command -v nvm)" ]]', (commando) => {
			commando.append('nvm --version');
		}).execute((stdout) => stdout);
	}

	/**
	 * Installs a specific Node.js version via NVM.
	 * 
	 * @param requiredVersion - Node.js version to install (e.g., '18.0.0')
	 * @returns This instance for method chaining
	 */
	async installNodeVersion(requiredVersion: string) {
		await this.append(`nvm install ${requiredVersion}`)
			.execute();

		return this;
	}

	/**
	 * Gets all installed Node.js versions.
	 * 
	 * Parses `nvm ls` output to extract version numbers, removing ANSI codes
	 * and filtering out invalid entries.
	 * 
	 * @returns Promise resolving to array of version strings (without 'v' prefix)
	 */
	getInstalledNodeVersions = async () => {
		function extractInstalledVersions(rawOutput: string) {
			const cleanedOutput = removeAnsiCodes(rawOutput);
			const lines = cleanedOutput.split('\n');
			const filteredVersionLines = lines
				.filter(line => !!line && line.match(/v\d+\.\d+\.\d+/) && !line.includes('N/A'));

			return filterDuplicates(filteredVersionLines
				.map(line => line.match(/v(\d+\.\d+\.\d+)/)?.[1]));
		}

		const versionsAsString = this.append('nvm ls').execute((stdout) => stdout);
		return extractInstalledVersions((await versionsAsString));
	};
}