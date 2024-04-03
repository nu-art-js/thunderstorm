import {ChildProcessWithoutNullStreams, ExecOptions, exec, spawn} from 'child_process';
import {CreateMergedInstance} from './class-merger';
import {Constructor} from '../../../../ts-common/src/main';
import {CliError} from './CliError';


const colors = {
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	reset: '\x1b[0m' // Resets the color
};

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

export class Cli {
	private indentation = 0;
	private option: Options;
	private commands: string[] = [];
	private _debug: boolean = false;
	private cliOptions: Partial<CliOptions> = {shell: '/bin/bash'};

	// private shell?: ChildProcessWithoutNullStreams;

	/**
	 * Constructs a CLI instance with given options.
	 * @param {Options} options - Configuration options for the CLI instance.
	 */
	constructor(options: Partial<Options> = defaultOptions) {
		this.option = options as Options;
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

	readonly indentIn = () => {
		this.indentation++;
	};

	readonly indentOut = () => {
		this.indentation++;
	};

	private getIndentation(): string {
		return ' '.repeat(this.option.indentation * this.indentation);
	}

	/**
	 * Executes the accumulated commands in the command list.
	 * @returns {Promise<string>} A promise that resolves with the standard output of the executed command.
	 */
	execute = async (): Promise<{ stdout: string, stderr: string }> => {
		const command = this.commands.join(this.option.newlineDelimiter);
		if (this._debug)
			console.log(`executing: `, `"""\n${command}\n"""`);

		// if (this.shell) {
		// 	this.shell.stdin.write(command, 'utf-8', (err?: Error) => {
		// 		if (err)
		// 			console.error(err);
		// 	});
		// 	this.commands = [];
		// 	return;
		// }

		return new Promise((resolve, reject) => {
			exec(command, this.cliOptions, (error, stdout, stderr) => {
				this.commands = [];

				if (error) {
					reject(new CliError(`executing:\n${command}\n`, stdout, stderr, error));
				}

				if (stderr)
					reject(stderr);

				resolve({stdout, stderr});
			});
		});
	};

	// interactive = () => {
	// 	this.shell = spawn('bash');
	//
	// 	// Handle shell output (stdout)
	// 	this.shell.stdout.on('data', (data) => {
	// 		console.log(`${colors.blue}${data}${colors.reset}`);
	// 	});
	//
	// 	this.shell.stderr.on('data', (data) => {
	// 		console.log(`${colors.red}${data}${colors.reset}`);
	// 	});
	//
	// 	// Handle shell errors (stderr)
	// 	this.shell.on('data', (data) => {
	// 		console.log(`${colors.green}${data}${colors.reset}`);
	// 	});
	//
	// 	// Handle shell exit
	// 	this.shell.on('close', (code) => {
	// 		console.log(`child process exited with code ${code}`);
	// 	});
	// };

	// endInteractive = () => {
	// 	this.shell?.stdin.end();
	// 	delete this.shell;
	// };

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
	};

	debug(debug?: boolean) {
		this._debug = debug ?? !this._debug;
		return this._debug;
	}
}

export class CliWrapper {
	cli!: Cli;
}

export class Commando
	extends CliWrapper {

	static create<T extends Constructor<CliWrapper>[]>(...plugins: T) {
		const _commando = CreateMergedInstance(...plugins);
		const commando = _commando as Commando & typeof _commando;
		const cli = new Cli();
		commando.cli = cli;
		commando.execute = cli.execute;
		commando.debug = (debug?: boolean) => {
			cli.debug(debug);
			return commando;
		};
		commando.setOptions = (options: Partial<CliOptions>) => {
			cli.setOptions(options);
			return commando;
		};
		commando.setShell = (shell: string) => {
			cli.setShell(shell);
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
			cli.append(command);
			return commando;
		};
		// commando.interactive = () => {
		// 	cli.interactive();
		// 	return commando;
		// };

		return commando;
	}

	setShell = (shell: string) => this;
	setOptions = (options: ExecOptions) => this;
	public debug = (debug?: boolean) => this;
	append = (command: string) => this;

	// interactive = () => this;
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
		super();
	}
}