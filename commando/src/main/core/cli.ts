import {exec, ExecOptions} from 'child_process';
import {CreateMergedInstance} from './class-merger';
import {CliError} from './CliError';
import {Constructor, Logger, LogLevel} from '@nu-art/ts-common';
import {ChildProcessWithoutNullStreams, spawn} from 'node:child_process';


export type CliBlock<Cli extends CliWrapper> = (cli: Cli) => void;
export type CliOptions = ExecOptions & {
	encoding: BufferEncoding | string | null;
}
/**
 * Type definition for options used in Cli class.
 */
type Options = {
	newlineDelimiter: string; // Delimiter used for separating commands in execute function.
	indentation: number; // Number of spaces for each indentation level.
};

/**
 * Default options for Cli class instances.
 */
const defaultOptions: Options = {
	newlineDelimiter: '\n',
	indentation: 2,
};

export class BaseCLI
	extends Logger {

	protected commands: string[] = [];
	private indentation: number = 0;
	protected _debug: boolean = false;
	protected option: Options;

	/**
	 * Constructs a CLI instance with given options.
	 * @param {Options} options - Configuration options for the CLI instance.
	 */
	constructor(options: Partial<Options> = defaultOptions) {
		super();
		this.setMinLevel(LogLevel.Verbose);
		this.option = options as Options;
	}

	protected getIndentation = (): string => {
		return ' '.repeat(this.option.indentation * this.indentation);
	};

	readonly indentIn = () => {
		this.indentation++;
	};

	readonly indentOut = () => {
		this.indentation++;
	};

	debug(debug?: boolean) {
		this._debug = debug ?? !this._debug;
		return this._debug;
	}

	/**
	 * Appends a command or a Cli instance to the command list with proper indentation.
	 * @param {string} command - The command or Cli instance to append.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	readonly append = (command: string): this => {
		this.commands.push(`${this.getIndentation()}${command}`);
		return this;
	};

}

export class CliInteractive
	extends BaseCLI {

	private shell: ChildProcessWithoutNullStreams;

	constructor() {
		super();
		this.shell = spawn('/bin/bash', {});

		// Handle shell output (stdout)
		const printer = (data: Buffer) => {
			const message = data.toString().trim();
			if (!message.length)
				return;

			console.log(message);
		};

		this.shell.stdout.on('data', printer);

		this.shell.stderr.on('data', printer);

		// Handle shell errors (stderr)
		this.shell.on('data', printer);

		// Handle shell exit
		this.shell.on('close', (code) => {
			console.log(`child process exited with code ${code}`);
		});
	}

	execute = async (): Promise<void> => {
		const command = this.commands.join(this.option.newlineDelimiter);
		if (this._debug)
			this.logDebug(`executing: `, `"""\n${command}\n"""`);

		this.shell.stdin.write(command + this.option.newlineDelimiter, 'utf-8', (err?: Error | null) => {
			console.log('GOT HERE');
			if (err)
				console.error(err);
		});
		this.commands = [];
	};

	endInteractive = () => {
		this.shell.stdin.end();
	};
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
					console.log(stdout);
					this.logVerbose(stdout);
				}

				if (stderr)
					this.logVerboseBold(stderr);
				resolve({stdout, stderr});
			});
		});
	};

	/**
	 * Appends an empty line to the script for readability.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	public emptyLine(): this {
		this.append('');
		return this;
	}

	setShell(shell: string) {
		(this.cliOptions || (this.cliOptions = {})).shell = shell;
	}

	setOptions(options: Partial<CliOptions>) {
		this.cliOptions = options;
	}
}

export class CliWrapper {
	cli!: Cli;
}

export class Commando {
	cli!: Cli;

	static create<T extends Constructor<CliWrapper>[]>(...plugins: T) {
		const _commando = CreateMergedInstance(...plugins);
		const commando = _commando as Commando & typeof _commando;
		const cli = new Cli();
		cli.setMinLevel(LogLevel.Verbose);

		commando.cli = cli;
		commando.execute = () => commando.cli.execute();
		commando.debug = (debug?: boolean) => {
			commando.cli.debug(debug);
			return commando;
		};
		commando.setOptions = (options: Partial<CliOptions>) => {
			commando.cli.setOptions(options);
			return commando;
		};
		commando.setShell = (shell: string) => {
			commando.cli.setShell(shell);
			return commando;
		};
		commando.executeFile = (filePath: string, interpreter?: string) => {
			let command = filePath;

			// If an interpreter is provided, prefix the command with it.
			if (interpreter) {
				command = `${interpreter} ${filePath}`;
			}
			return new Cli().append(command).execute();
		};
		commando.executeRemoteFile = (pathToFile: string, interpreter: string) => {
			return new Cli().append(`curl -o- "${pathToFile}" | ${interpreter}`).execute();
		};
		commando.append = (command: string) => {
			commando.cli.append(command);
			return commando;
		};
		return commando;
	}

	setShell = (shell: string) => this;
	setOptions = (options: ExecOptions) => this;
	public debug = (debug?: boolean) => this;
	append = (command: string) => this;

	execute = async (): Promise<{ stdout: string, stderr: string }> => ({stdout: '', stderr: '',});// placeholder

	/**
	 * Executes a given file.
	 * @param {string} filePath - The path to the file to execute.
	 * @param {string} [interpreter] - Optional. The interpreter to use for executing the file (e.g., "python", "bash").
	 *                                 If not provided, the file is executed directly.
	 *
	 * @returns {Cli} - The script execution output.
	 */
	executeFile = async (filePath: string, interpreter?: string): Promise<{ stdout: string, stderr: string }> => ({stdout: '', stderr: '',});
	executeRemoteFile = async (pathToFile: string, interpreter: string): Promise<{ stdout: string, stderr: string }> => ({stdout: '', stderr: '',});

	private constructor() {
	}
}

export class CommandoInteractive {

	cli!: CliInteractive;

	static create<T extends Constructor<CliWrapper>[]>(...plugins: T) {
		const _commando = Commando.create(...plugins);
		const commando = _commando as unknown as CommandoInteractive;
		const cli = new CliInteractive();
		cli.setMinLevel(LogLevel.Verbose);

		commando.cli = cli;

		commando.close = () => {

			return commando;
		};

		return commando as CommandoInteractive & typeof _commando;
	}

	close = () => this;

}
