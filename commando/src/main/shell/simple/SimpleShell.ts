import {exec, ExecOptions} from 'child_process';
import {Logger} from '@nu-art/ts-common';
import {CliError} from '../core/CliError';


export type CliOptions = ExecOptions & {
	encoding: BufferEncoding | string | null;
}
function toStringWithNewlines(input: string | Buffer<ArrayBufferLike>): string {
	if (typeof input === 'string')
		return input;

	return Buffer.isBuffer(input)
		? input.toString('utf8')
		: Buffer.from(input as ArrayBufferLike).toString('utf8');
}

export class SimpleShell
	extends Logger {
	private _debug: boolean = false;

	private cliOptions: Partial<CliOptions> = {shell: '/bin/bash'};

	/**
	 * Executes the accumulated commands in the command list.
	 * @returns {Promise<string>} A promise that resolves with the standard output of the executed command.
	 */
	execute = async (command: string): Promise<{ stdout: string, stderr: string }> => {
		if (this._debug)
			this.logDebug(`executing: `, `"""\n${command}\n"""`);

		return new Promise((resolve, reject) => {
			exec(command, this.cliOptions, (error, stdout, stderr) => {
				if (error) {
					return reject(new CliError(`executing:\n${command}\n`, toStringWithNewlines(stdout), toStringWithNewlines(stderr), error));
				}

				if (stdout)
					this.logInfo(stdout);

				if (stderr)
					this.logError(stderr);

				resolve({stdout:toStringWithNewlines(stdout), stderr:toStringWithNewlines(stderr)});
			});
		});
	};

	debug(debug?: boolean) {
		this._debug = debug ?? !this._debug;
		return this;
	}

	setShell(shell: string) {
		(this.cliOptions || (this.cliOptions = {})).shell = shell;
	}

	setOptions(options: Partial<CliOptions>) {
		this.cliOptions = options;
	}

	setUID(uid: string) {
		this.setTag(uid);
		return this;
	}
}
