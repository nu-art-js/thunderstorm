import {Constructor, LogLevel} from '@nu-art/ts-common';
import {BaseCLI, BaseCommando} from './BaseCommando';
import {exec, ExecOptions} from 'child_process';
import {CliError} from '../CliError';


export class Commando
	extends BaseCommando<Cli> {

	static create<T extends Constructor<any>[]>(...plugins: T) {
		const _commando = BaseCommando._create(Commando, BaseCommando, ...plugins);
		const commando = _commando as typeof _commando & Commando;

		commando.cli = new Cli();
		commando.cli.setMinLevel(LogLevel.Verbose);
		return commando;
	}

	executeFile = (filePath: string, interpreter?: string) => {
		let command = filePath;

		// If an interpreter is provided, prefix the command with it.
		if (interpreter) {
			command = `${interpreter} ${filePath}`;
		}
		return new Cli().append(command).execute();
	};

	executeRemoteFile = (pathToFile: string, interpreter: string) => {
		return new Cli().append(`curl -o- "${pathToFile}" | ${interpreter}`).execute();
	};

	execute = () => this.cli.execute();
}

export type CliOptions = ExecOptions & {
	encoding: BufferEncoding | string | null;
}

export class Cli
	extends BaseCLI {

	private cliOptions: Partial<CliOptions> = {shell: '/bin/bash'};

	/**
	 * Executes the accumulated commands in the command list.
	 * @returns {Promise<string>} A promise that resolves with the standard output of the executed command.
	 */
	execute = async (): Promise<{ stdout: string, stderr: string }> => {
		const command = this.commands.join(this.option.newlineDelimiter);
		if (this._debug)
			this.logDebug(`executing: `, `"""\n${command}\n"""`);

		return new Promise((resolve, reject) => {
			exec(command, this.cliOptions, (error, stdout, stderr) => {
				this.commands = [];

				if (error) {
					reject(new CliError(`executing:\n${command}\n`, stdout, stderr, error));
				}

				if (stderr)
					reject(stderr);

				if (stdout) {
					this.stdoutProcessors.forEach(processor => processor(stdout));
					this.logInfo(stdout);
				}

				if (stderr) {
					this.stderrProcessors.forEach(processor => processor(stdout));
					this.logError(stderr);
				}
				resolve({stdout, stderr});
			});
		});
	};

	setShell(shell: string) {
		(this.cliOptions || (this.cliOptions = {})).shell = shell;
	}

	setOptions(options: Partial<CliOptions>) {
		this.cliOptions = options;
	}
}
