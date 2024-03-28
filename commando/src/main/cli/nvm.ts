import {Cli_Programming} from './programming';
import {Cli_Basic} from './basic';
import {CliWrapper, Commando} from '../core/cli';
import * as fs from 'fs';
import {promises as _fs} from 'fs';
import * as path from 'path';
import {filterDuplicates, removeAnsiCodes} from '../../test/bai/core/tools';
import {Constructor} from '../../test/bai/core/types';


const CONST__FILE_NVMRC = '.nvmrc';

export class Cli_NVM {

	private _expectedVersion = '0.35.3';
	private _homeEnvVar = '$NVM_DIR';

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

	install = async () => {
		if (this.isInstalled()) {
			const version = (await this.getVersion()).stdout.trim();
			if (this._expectedVersion === version)
				return;

			await this.uninstall();
		}

		await Commando.create()
			.append(`  curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/v${this._expectedVersion}/install.sh" | bash`)
			.execute();

		const rcFile = path.resolve(process.env['HOME']!, '.bashrc');
		let rcFileContent: string = '';
		if (fs.existsSync(rcFile)) {
			rcFileContent = await _fs.readFile(rcFile, {encoding: 'utf8'});
			return rcFileContent.includes('NVM_DIR');
		}

		rcFileContent = `${rcFileContent}\n${rcFileContent.endsWith('\n') ? '' : '\n'}`;
		rcFileContent += `# generated NVM - start\n`;
		rcFileContent += `echo 'export NVM_DIR="$HOME/.nvm"'\n`;
		rcFileContent += `echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm'\n`;
		rcFileContent += `echo '[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion'\n`;
		rcFileContent += `# generated NVM - end\n`;
		await _fs.writeFile(rcFile, rcFileContent, {encoding: 'utf8'});

		return this;
	};

	isInstalled = () => !!process.env[this._homeEnvVar] && fs.existsSync(process.env[this._homeEnvVar]!);

	getRequiredNode_Version = async () => {
		const absolutePathToNvmrcFile = path.resolve(CONST__FILE_NVMRC);
		if (!fs.existsSync(absolutePathToNvmrcFile))
			throw new Error(`couldn't find .nvmrc file at: ${absolutePathToNvmrcFile}`);

		const content = await _fs.readFile(absolutePathToNvmrcFile, {encoding: 'utf-8'});
		return content.trim();
	};

	installRequiredVersionIfNeeded = async () => {
		const requiredVersion = await this.getRequiredNode_Version();
		const installedVersions = await this.getInstalledNode_Versions();
		if (installedVersions.includes(requiredVersion))
			return;

		await this.installVersion();
	};

	getInstalledNode_Versions = async () => {
		function extractInstalledVersions(rawOutput: string) {
			const cleanedOutput = removeAnsiCodes(rawOutput);
			const lines = cleanedOutput.split('\n');
			const filteredVersionLines = lines
				.filter(line => !!line && line.match(/v\d+\.\d+\.\d+/) && !line.includes('N/A'));

			return filterDuplicates(filteredVersionLines
				.map(line => line.match(/v(\d+\.\d+\.\d+)/)?.[1]));
		}

		return extractInstalledVersions((await this.createCommando()
			.append('nvm ls')
			.execute()).stdout);
	};

	private async getVersion() {
		const commando = Commando.create(Cli_Programming, Cli_Basic);
		return commando.if('[[ -x "$(command -v nvm)" ]]', (commando) => {
			commando.cli.append('nvm --version');
		}).execute();
	}

	uninstall = async () => {
		console.log('Uninstalling PNPM');
		const absolutePathToNVM_Home = process.env[this._homeEnvVar];
		if (!absolutePathToNVM_Home)
			return;

		fs.rmSync(absolutePathToNVM_Home, {recursive: true, force: true});
	};

	private installVersion = async () => {
		return this.createCommando().append(`nvm install ${await this.getRequiredNode_Version()}`).execute();
	};

	// createInteractiveCommando<T extends Constructor<CliWrapper>[]>(...plugins: T) {
	// 	return this.createCommando(...plugins)
	// 		.interactive()
	// 		.append('export NVM_DIR="$HOME/.nvm"')
	// 		.append('[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm')
	// 		.append('[ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"  # This loads nvm bash_completion')
	// 		.append('nvm use');
	// }

	createCommando<T extends Constructor<CliWrapper>[]>(...plugins: T) {
		return Commando.create(...plugins)
			.append('export NVM_DIR="$HOME/.nvm"')
			.append('[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm')
			.append('[ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"  # This loads nvm bash_completion');
	}
}

export const NVM = new Cli_NVM();