import {exec, ExecOptions} from 'child_process';
import {Logger} from '@nu-art/ts-common';
import {CliError} from '../core/CliError.js';


/**
 * Extended ExecOptions with encoding support.
 */
export type CliOptions = ExecOptions & {
	encoding: BufferEncoding | string | null;
}

/**
 * Converts input to string, handling Buffer and ArrayBufferLike types.
 *
 * @param input - String, Buffer, or ArrayBufferLike to convert
 * @returns UTF-8 string representation
 */
function toStringWithNewlines(input: string | Buffer<ArrayBufferLike>): string {
	if (typeof input === 'string')
		return input;

	return Buffer.isBuffer(input)
		? input.toString('utf8')
		: Buffer.from(input as ArrayBufferLike).toString('utf8');
}

/**
 * Simple shell command executor using Node.js child_process.
 *
 * Executes shell commands synchronously via `exec()` and handles
 * output conversion. Supports debug logging and custom shell/options.
 *
 * **Behavior**:
 * - Uses `/bin/bash` as default shell
 * - Converts Buffer output to UTF-8 strings
 * - Logs stdout as info, stderr as error
 * - Throws CliError on command failure
 * - Supports UID tagging for log identification
 */
export class SimpleShell
	extends Logger {
	/** Debug mode flag (enables verbose command logging) */
	private _debug: boolean = false;

	/** Execution options for child_process.exec() */
	private cliOptions: Partial<CliOptions> = {shell: '/bin/bash'};

	/**
	 * Executes a shell command and returns stdout/stderr.
	 *
	 * **Behavior**:
	 * - Logs command in debug mode (wrapped in triple quotes)
	 * - Converts Buffer output to UTF-8 strings
	 * - Logs stdout as info, stderr as error
	 * - Throws CliError if command fails (non-zero exit code)
	 *
	 * @param command - Shell command string to execute
	 * @returns Promise resolving to stdout and stderr strings
	 * @throws CliError if command execution fails
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

				resolve({stdout: toStringWithNewlines(stdout), stderr: toStringWithNewlines(stderr)});
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
