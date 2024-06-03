import {exec, ExecOptions} from 'child_process';
import {CreateMergedInstance} from './class-merger';
import {CliError} from './CliError';
import {
	AsyncVoidFunction,
	Constructor, filterInOut,
	generateHex,
	Logger,
	LogLevel,
	removeItemFromArray,
	ThisShouldNotHappenException,
	voidFunction
} from '@nu-art/ts-common';
import {ChildProcess, ChildProcessWithoutNullStreams, spawn} from 'node:child_process';


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

	protected stderrValidator: ((stdout: string) => boolean) = () => true;
	protected stdoutProcessors: ((stdout: string) => void)[] = [];
	protected stderrProcessors: ((stdout: string) => void)[] = [];

	protected commands: string[] = [];
	private indentation: number = 0;
	protected _debug: boolean = true;
	protected option: Options;
	protected uid: string = generateHex((8));

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

	setUID(uuid: string) {
		this.setTag(uuid);
	}

	setStdErrorValidator(processor: (stderr: string) => boolean) {
		this.stderrValidator = processor;
	}

	addStdoutProcessor(processor: (stdout: string) => void) {
		this.stdoutProcessors.push(processor);
	}

	addStderrProcessor(processor: (stderr: string) => void) {
		this.stderrProcessors.push(processor);
	}

	removeStdoutProcessor(processor: (stdout: string) => void) {
		removeItemFromArray(this.stdoutProcessors, processor);
	}

	removeStderrProcessor(processor: (stderr: string) => void) {
		removeItemFromArray(this.stderrProcessors, processor);
	}

}

export class CliInteractive
	extends BaseCLI {

	private shell: ChildProcessWithoutNullStreams | ChildProcess;
	private alive: boolean;

	constructor() {
		super();
		this.shell = spawn('/bin/bash', {
			detached: true,  // This is important to make the process a session leader
			shell: true
		});

		//set alive
		this.alive = true;

		// Handle shell output (stdout)
		const printer = (data: Buffer) => {
			const message = data.toString().trim();
			if (!message.length)
				return;

			try {
				if (!this.stderrValidator(message))
					this.stdoutProcessors.forEach(processor => processor(message));
				else
					this.stderrProcessors.forEach(processor => processor(message));

				this.logInfo(`${message}`);
			} catch (e: any) {
				this.logError(e);
			}
		};

		this.shell.stdout?.on('data', printer);

		this.shell.stderr?.on('data', printer);

		// Handle shell errors (stderr)
		this.shell.on('data', printer);

		// Handle shell exit
		this.shell.on('close', (code) => {
			this.alive = false;
			this.logInfo(`child process exited with code ${code}`);
		});
	}

	execute = async (): Promise<void> => {
		const command = this.commands.join(this.option.newlineDelimiter);
		if (this._debug)
			this.logDebug(`executing: `, `"""\n${command}\n"""`);

		this.shell.stdin?.write(command + this.option.newlineDelimiter, 'utf-8', (err?: Error | null) => {
			if (err)
				this.logError(`error`, err);
		});
		this.commands = [];
	};

	endInteractive = (cb?: AsyncVoidFunction) => {
		this.shell.stdin?.end(cb);
	};

	kill = (signal?: NodeJS.Signals | number) => {
		return this.shell.kill(signal);
	};

	gracefullyKill = async (pid?: number) => {
		// if the shell is already dead no need to wait for kill
		if (!this.alive)
			return;

		return new Promise<void>((resolve, reject) => {
			this.shell.on('exit', async (code, signal) => {
				this.alive = false;
				resolve();
			});

			if (pid) {
				process.kill(pid, 'SIGINT');
			} else {
				this.shell.kill('SIGINT');
			}

		});
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

				const errorLogs = stderr.split('\n');
				const {filteredIn, filteredOut} = filterInOut(errorLogs, this.stderrValidator);

				stderr = filteredIn.join('\n').trim();
				if (stderr && stderr.length > 0)
					reject(stderr);

				const stdErrToOut = filteredOut.join('\n').trim();
				if (stdErrToOut && stdErrToOut.length > 0)
					stdout += `from stderr: \n${stdErrToOut}`;
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
		commando.setUID = (uid: string) => {
			commando.cli.setUID(uid);
			return commando;
		};

		commando.addStdoutProcessor = (processor) => {
			cli.addStdoutProcessor(processor);
			return commando;
		};
		commando.addStderrProcessor = (processor) => {
			cli.addStderrProcessor(processor);
			return commando;
		};
		commando.removeStdoutProcessor = (processor) => {
			cli.removeStdoutProcessor(processor);
			return commando;
		};
		commando.removeStderrProcessor = (processor) => {
			cli.removeStderrProcessor(processor);
			return commando;
		};
		commando.setStdErrorValidator = (processor) => {
			cli.setStdErrorValidator(processor);
			return commando;
		};
		return commando;
	}

	setShell = (shell: string) => this;
	setOptions = (options: ExecOptions) => this;
	public debug = (debug?: boolean) => this;
	append = (command: string) => this;
	setUID = (uid: string) => this;

	execute = async (): Promise<{ stdout: string, stderr: string }> => ({stdout: '', stderr: '',});// placeholder

	/**
	 * Executes a given file.
	 * @param {string} filePath - The path to the file to execute.
	 * @param {string} [interpreter] - Optional. The interpreter to use for executing the file (e.g., "python", "bash").
	 *                                 If not provided, the file is executed directly.
	 *
	 * @returns {Cli} - The script execution output.
	 */
	executeFile = async (filePath: string, interpreter?: string): Promise<{
		stdout: string,
		stderr: string
	}> => ({stdout: '', stderr: '',});
	executeRemoteFile = async (pathToFile: string, interpreter: string): Promise<{
		stdout: string,
		stderr: string
	}> => ({stdout: '', stderr: '',});

	addStdoutProcessor = (processor: (stdout: string) => void) => this;
	addStderrProcessor = (processor: (stderr: string) => void) => this;
	removeStdoutProcessor = (processor: (stdout: string) => void) => this;
	removeStderrProcessor = (processor: (stderr: string) => void) => this;
	setStdErrorValidator = (processor: (stderr: string) => boolean) => this;

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
		commando.setUID = (uid: string) => {
			commando.cli.setUID(uid);
			return commando;
		};

		commando.close = (cb?: AsyncVoidFunction) => {
			commando.cli.endInteractive(cb);
			return commando;
		};

		commando.kill = (signal?: NodeJS.Signals | number) => {
			return commando.cli.kill(signal);
		};

		commando.gracefullyKill = async (pid?: number) => {
			await commando.cli.gracefullyKill(pid);
		};
		commando.addStdoutProcessor = (processor) => {
			cli.addStdoutProcessor(processor);
			return commando;
		};
		commando.addStderrProcessor = (processor) => {
			cli.addStderrProcessor(processor);
			return commando;
		};
		commando.removeStdoutProcessor = (processor) => {
			cli.removeStdoutProcessor(processor);
			return commando;
		};
		commando.removeStderrProcessor = (processor) => {
			cli.removeStderrProcessor(processor);
			return commando;
		};
		commando.setStdErrorValidator = (processor) => {
			cli.setStdErrorValidator(processor);
			return commando;
		};
		return commando as CommandoInteractive & typeof _commando;
	}

	addStdoutProcessor = (processor: (stdout: string) => void) => this;
	addStderrProcessor = (processor: (stderr: string) => void) => this;
	removeStdoutProcessor = (processor: (stdout: string) => void) => this;
	removeStderrProcessor = (processor: (stderr: string) => void) => this;
	setStdErrorValidator = (processor: (stderr: string) => boolean) => this;
	setUID = (uid: string) => this;
	close = (cb?: AsyncVoidFunction) => this;
	kill = (signal?: NodeJS.Signals | number) => true;

	gracefullyKill = (pid?: number) => {
		return new Promise<void>(resolve => resolve());
	};
}

type CommandoCLIListener_Callback = (stdout: string) => void;

export class CommandoCLIListener {

	private cb: CommandoCLIListener_Callback;
	protected filter?: RegExp;

	constructor(callback: CommandoCLIListener_Callback, filter?: string | RegExp) {
		this.cb = callback;
		if (!filter)
			return;

		if (typeof filter === 'string')
			this.filter = new RegExp(filter);
		else
			this.filter = filter as RegExp;
	}

	//######################### Inner Logic #########################

	private _process(stdout: string) {
		if (!this.stdoutPassesFilter(stdout))
			return;

		this.process(stdout);
	}

	private stdoutPassesFilter = (stdout: string): boolean => {
		if (!this.filter)
			return true;

		return this.filter.test(stdout);
	};

	//######################### Functions #########################

	public listen = <T extends Commando | CommandoInteractive>(commando: T): T => {
		const process = this._process.bind(this);
		commando.addStdoutProcessor(process);
		commando.addStderrProcessor(process);
		return commando;
	};

	protected process(stdout: string) {
		this.cb(stdout);
	}
}

export class CommandoCLIKeyValueListener
	extends CommandoCLIListener {

	private value: string | undefined;

	constructor(pattern: string | RegExp) {
		const filter = typeof pattern === 'string' ? new RegExp(pattern) : pattern as RegExp;
		super(voidFunction, filter);
	}

	//######################### Inner Logic #########################

	private setValue = (value: string) => {
		this.value = value;
	};

	//######################### Functions #########################

	protected process(stdout: string) {
		const pattern = this.filter;
		if (!pattern)
			throw new ThisShouldNotHappenException('Class does not have a pattern, but it should have been initialized with one');

		const value = stdout.match(pattern)?.[1];
		if (value)
			this.setValue(value);
	}

	public getValue = () => this.value;
}