import * as fs from 'fs';
import {promises as _fs} from 'fs';
import * as path from 'path';
import {Logger, LogLevel} from '@nu-art/ts-common';
import {Commando_NVM} from '../plugins/nvm';


const CONST__FILE_NVMRC = '.nvmrc';

export class Cli_NVM
	extends Logger {

	private _expectedVersion = '0.39.7';
	private _homeEnvVar = '$NVM_DIR';

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

	install = async (commando: Commando_NVM) => {
		if (this.isInstalled()) {
			const version = (await commando.getVersion()).trim();
			if (this._expectedVersion === version)
				return;

			await this.uninstall();
		}

		await commando.install(this._expectedVersion);

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

	installRequiredVersionIfNeeded = async (commando: Commando_NVM) => {
		const requiredVersion = await this.getRequiredNode_Version();
		const installedVersions = await commando.getInstalledNodeVersions();
		this.logDebug('Found versions:', installedVersions);
		if (installedVersions.includes(requiredVersion))
			return false;

		await this.installVersion(commando, requiredVersion);
		return true;
	};

	uninstall = async () => {
		this.logDebug('Uninstalling PNPM');
		const absolutePathToNVM_Home = process.env[this._homeEnvVar];
		if (!absolutePathToNVM_Home)
			return;

		fs.rmSync(absolutePathToNVM_Home, {recursive: true, force: true});
	};

	private installVersion = async (commando: Commando_NVM, requiredVersion?: string) => {
		requiredVersion ??= await this.getRequiredNode_Version();
		this.logDebug(`Installing version: ${requiredVersion}`);
		return commando.installNodeVersion(requiredVersion);
	};
}

export const NVM = new Cli_NVM();