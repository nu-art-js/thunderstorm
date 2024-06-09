import {BaseCommando} from '../core/BaseCommando';
import {Commando_Programming} from './programming';
import {MergeClass} from '../core/class-merger';
import {Commando_Basic} from './basic';
import {Exception, filterDuplicates} from '@nu-art/ts-common';
import {removeAnsiCodes} from '../tools';


const Super = MergeClass(BaseCommando, Commando_Programming, Commando_Basic);

export class Commando_NVM
	extends Super {

	applyNVM(): this {
		this.append('export NVM_DIR="$HOME/.nvm"')
			.append('[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm')
			.append('nvm use');

		return this;
	}

	async install(version: string) {
		this.append(`curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/v${version}/install.sh" | bash`);
		await this.execute((stdout, stderr, exitCode) => {
			if (exitCode !== 0)
				throw new Exception(`Error installing NVM - exit code (${exitCode})`);
		});
		return this;
	}

	async getVersion() {
		return this.if('[[ -x "$(command -v nvm)" ]]', (commando) => {
			commando.append('nvm --version');
		}).execute((stdout) => stdout);
	}

	async installNodeVersion(requiredVersion: string) {
		await this.append(`nvm install ${requiredVersion}`)
			.execute();

		return this;
	}

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