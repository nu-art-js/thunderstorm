import {Constructor, generateHex, LogLevel} from '@nu-art/ts-common';
import {InteractiveShell, ShellLogProcessor, ShellPidListener} from './InteractiveShell.js';
import {LogTypes} from '../types.js';
import {BaseCommando} from '../core/BaseCommando.js';


/**
 * Interactive shell command executor extending BaseCommando.
 *
 * Maintains a persistent bash session and executes commands in sequence,
 * allowing state to persist between commands. Provides advanced features:
 * - Log processing and filtering
 * - Exit code extraction
 * - Background process management
 * - PID tracking for subprocesses
 *
 * **Key Differences from Commando**:
 * - Uses InteractiveShell (persistent session) vs SimpleShell (one-shot)
 * - Commands execute in the same shell context (variables persist)
 * - Supports log processors for reactive command execution
 * - Can run background processes and track their PIDs
 *
 * **Exit Code Extraction**:
 * Uses a unique key pattern (`echo ${key}=$?`) to extract exit codes
 * from both stdout and stderr, ensuring accurate exit code detection.
 */
export class CommandoInteractive
	extends BaseCommando {
	/** Interactive shell instance managing the persistent session */
	private shell: InteractiveShell;

	/**
	 * Creates a CommandoInteractive instance with plugins.
	 *
	 * Initializes the InteractiveShell after merging plugins.
	 *
	 * @template T - Array of plugin constructor types
	 * @param plugins - Plugin classes to merge
	 * @returns Merged CommandoInteractive instance with plugins
	 */
	static create<T extends Constructor<any>[]>(...plugins: T) {
		const _commando = BaseCommando._create(CommandoInteractive, ...plugins);
		const commando = _commando as typeof _commando & CommandoInteractive;
		commando.shell = new InteractiveShell();
		return commando;
	}

	/**
	 * Constructs a CommandoInteractive instance.
	 */
	constructor() {
		super();
		this.shell = new InteractiveShell();
	}

	/**
	 * Toggles or sets the debug mode.
	 * @param {boolean} [debug] - If provided, sets the debug mode to this value. Otherwise, toggles the current debug mode.
	 * @returns {boolean} - The current state of debug mode.
	 */
	debug(debug?: boolean) {
		this.shell.debug(debug);
		return super.debug(debug);
	}

	/**
	 * Sets the UID for the shell.
	 * @param {string} uid - The UID to set.
	 * @returns {this} - The CommandoInteractive instance for method chaining.
	 */
	setUID(uid: string) {
		this.shell.setUID(uid);
		return this;
	}

	/**
	 * Closes the shell, optionally with a callback function.
	 * @returns {this} - The CommandoInteractive instance for method chaining.
	 */
	close() {
		return this.shell.endInteractive();
	}

	/**
	 * Kills the shell process with a given signal.
	 * @param {NodeJS.Signals | number} [signal] - The signal to send to the process.
	 * @returns {boolean} - Whether the kill signal was successfully sent.
	 */
	kill(signal?: NodeJS.Signals) {
		return this.shell.kill(signal);
	}

	/**
	 * Gracefully kills a process by its PID.
	 * @param {number} [pid] - The PID of the process to kill.
	 * @param signal
	 */
	async killSubprocess(pid: number, signal?: NodeJS.Signals) {
		return this.shell.killSubprocess(pid, signal);
	}

	/**
	 * Waits for a log entry that matches a specified pattern, then executes a callback.
	 * @param {string | RegExp} filter - The pattern to match in log entries.
	 * @param {(match: RegExpMatchArray) => any} callback - The callback to execute when a match is found.
	 */
	onLog(filter: string | RegExp, callback: (match: RegExpMatchArray) => any) {
		const regexp = typeof filter === 'string' ? new RegExp(filter) : filter;
		const logFilter = (log: string) => {
			const match = log.match(regexp);
			if (!match)
				return true;

			callback(match);
			return true;
		};

		this.addLogProcessor(logFilter);
		return this;
	}

	/**
	 * Executes accumulated commands and extracts exit code from shell output.
	 *
	 * **Exit Code Extraction Strategy**:
	 * - Appends `echo ${uniqueKey}=$?` to both stdout and stderr
	 * - Uses log processors to detect the unique key pattern
	 * - Waits for both outputs (stdout and stderr) to capture exit code
	 * - Falls back to shell close event if pattern not detected
	 *
	 * **Log Processing**:
	 * - Adds temporary log processors to capture stdout/stderr
	 * - Accumulates all output until exit code is detected
	 * - Removes processors after execution (in finally block)
	 *
	 * **Behavior**:
	 * - Resolves when exit code is detected or shell closes
	 * - Calls callback with accumulated stdout, stderr, and exit code
	 * - Always cleans up log processors (even on error)
	 *
	 * @template T - Return type of callback
	 * @param callback - Function to process command output
	 * @returns Promise resolving to callback result
	 */
	async execute<T>(callback?: (stdout: string, stderr: string, exitCode: number) => T): Promise<T> {
		let logProcessor;
		let stdLogProcessor;
		let onCloseListener;

		try {
			return await new Promise<T>((resolve, reject) => {
				const uniqueKey = generateHex(16);
				const regexp = new RegExp(`${uniqueKey}=(\\d+)`);

				let _stderr = '';
				let _stdout = '';
				stdLogProcessor = (log: string, type: LogTypes) => {
					if (type === 'err')
						_stderr += `${log}\n`;
					else
						_stdout += `${log}\n`;

					return true;
				};

				let uidCounter = 0;
				let exitCode = -1;
				logProcessor = (log: string, type: LogTypes) => {
					if (!log.includes(uniqueKey))
						return true;

					const match = log.match(regexp);
					if (!match)
						return false;

					uidCounter++;
					if (type === 'out')
						exitCode = +(match![1]);

					if (uidCounter !== 2)
						return false;

					try {
						resolve(callback?.(_stdout, _stderr, +exitCode)!);
					} catch (err: any) {
						reject(err);
					}

					return false;
				};

				onCloseListener = (exitCode: number) => {
					resolve(callback?.(_stdout, _stderr, exitCode)!);
				};

				this.builder.append(`echo ${uniqueKey}=$? && echo ${uniqueKey}=$? 1>&2`);
				const command = this.builder.reset();

				this.shell.addLogProcessor(logProcessor, 0);
				this.shell.addLogProcessor(stdLogProcessor);
				this.shell.addOnCloseListener(onCloseListener);
				this.shell.execute(command);
			});
		} finally {
			this.shell.removeLogProcessor(logProcessor!);
			this.shell.removeLogProcessor(stdLogProcessor!);
			this.shell.removeOnCloseListener(onCloseListener!);
		}

	}

	/**
	 * Adds a log processor to the shell.
	 * @param {Function} processor - The log processor function to add.
	 * @param index
	 * @returns {this} - The CommandoInteractive instance for method chaining.
	 */
	addLogProcessor(processor: ShellLogProcessor, index?: number) {
		this.shell.addLogProcessor(processor, index);
		return this;
	}

	setLogLevelFilter(processor: (log: string, std: LogTypes) => LogLevel | undefined) {
		this.shell.setLogLevelFilter(processor);
		return this;
	}

	/**
	 * Removes a log processor from the shell.
	 * @param {Function} processor - The log processor function to remove.
	 * @returns {this} - The CommandoInteractive instance for method chaining.
	 */
	removeLogProcessor(processor: ShellLogProcessor) {
		this.shell.removeLogProcessor(processor);
		return this;
	}

	/**
	 * Appends a command to the command list.
	 * @param {string} command - The command to append.
	 * @returns {this} - The CommandoInteractive instance for method chaining.
	 */
	append(command: string) {
		this.builder.append(command);
		return this;
	}

	mark() {
		this.builder.setMark();
		return this;
	}

	/**
	 * Appends a command to run in the background and tracks its PID.
	 *
	 * **Behavior**:
	 * - Runs command with `&` (background)
	 * - Captures PID using `pid=$!` and echoes it with unique key
	 * - Waits for the process to complete
	 * - Calls pidListener when PID is detected
	 *
	 * **Use Case**: Running long-running processes while continuing
	 * to execute other commands in the same shell session.
	 *
	 * @param command - Command to run in background
	 * @param pidListener - Optional callback when PID is detected
	 * @returns This instance for method chaining
	 */
	appendAsync(command: string, pidListener?: ShellPidListener) {
		const pidUniqueKey = generateHex(16);
		const regexp = new RegExp(`${pidUniqueKey}=(\\d+)`);

		const pidLogProcessor = async (log: string) => {
			const match = log.match(regexp);
			if (!match)
				return true;

			const pid = +match[1];
			await pidListener?.(pid);
			return false;
		};

		this.append(`${command} &`)
			.append('pid=$!')
			.append(`echo "${pidUniqueKey}=\${pid}"`)
			.append(`wait \$pid`)
			.addLogProcessor(pidLogProcessor, 0);

		return this;
	}

	getCommand() {
		return this.builder.getCommand();
	}
}
