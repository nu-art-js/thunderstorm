import {Constructor, generateHex, LogLevel} from '@nu-art/ts-common';
import {InteractiveShell} from './InteractiveShell';
import {LogTypes} from '../types';
import {BaseCommando} from '../core/BaseCommando';


export class CommandoInteractive
	extends BaseCommando {
	private shell: InteractiveShell;

	/**
	 * Creates a new instance of CommandoInteractive merged with the provided plugins.
	 * @param {Constructor<any>[]} plugins - The plugins to merge with CommandoInteractive.
	 * @returns {CommandoInteractive} - The new instance of CommandoInteractive merged with the plugins.
	 */
	static create<T extends Constructor<any>[]>(...plugins: T) {
		const _commando = BaseCommando._create(CommandoInteractive, ...plugins);
		const commando = _commando as typeof _commando & CommandoInteractive;
		commando.shell = new InteractiveShell();
		commando.shell.setMinLevel(LogLevel.Verbose);
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
	kill(signal?: NodeJS.Signals | number) {
		return this.shell.kill(signal);
	}

	/**
	 * Gracefully kills a process by its PID.
	 * @param {number} [pid] - The PID of the process to kill.
	 */
	async gracefullyKill(pid?: number) {
		return this.shell.gracefullyKill(pid);
	}

	/**
	 * Waits for a log entry that matches a specified pattern, then executes a callback.
	 * @param {string | RegExp} filter - The pattern to match in log entries.
	 * @param {(match: RegExpMatchArray) => any} callback - The callback to execute when a match is found.
	 */
	onLog(filter: string | RegExp, callback: (match: RegExpMatchArray) => any) {
		const regexp = typeof filter === 'string' ? new RegExp(filter) : filter;
		const pidLogProcessor = (log: string) => {
			const match = log.match(regexp);
			if (!match)
				return true;

			callback(match);
			return true;
		};


		this.addLogProcessor(pidLogProcessor);
	}

	/**
	 * Executes commands asynchronously and listens for the PID.
	 *
	 * @param {Function} pidListener - A listener function to handle the PID.
	 * @param {Function} [callback] - A callback function to handle the command output.
	 * @returns {Promise<T>} - The result of the callback function.
	 */
	async executeAsync<T>(pidListener: (pid: number) => void, callback?: (stdout: string, stderr: string, exitCode: number) => T): Promise<T> {
		const uniqueFunctionName = generateHex(16);
		const pidUniqueKey = generateHex(16);
		const regexp = new RegExp(`${pidUniqueKey}=(\\d+)`);

		const functionContent = this.builder.reset();
		const functionName = `${uniqueFunctionName}() {`;

		const pidLogProcessor = (log: string) => {
			const match = log.match(regexp);
			if (!match)
				return true;

			const pid = +match[1];
			pidListener(pid);
			return false;
		};

		return await this
			.append(functionName)
			.append(functionContent)
			.append('}')
			.append(`${uniqueFunctionName} &`)
			.append('pid=$!')
			.append(`echo "${pidUniqueKey}=\${pid}"`)
			.append(`wait \$pid`)
			.addLogProcessor(pidLogProcessor)
			.execute(callback);
	}

	/**
	 * Executes commands and processes logs to extract exit code.
	 * @param {Function} [callback] - A callback function to handle the command output.
	 * @returns {Promise<T>} - The result of the callback function.
	 */
	async execute<T>(callback?: (stdout: string, stderr: string, exitCode: number) => T): Promise<T> {
		return await new Promise<T>((resolve, reject) => {
			const uniqueKey = generateHex(16);
			const regexp = new RegExp(`${uniqueKey}=(\\d+)`);

			let _stderr = '';
			let _stdout = '';
			const logProcessor = (log: string, type: LogTypes) => {
				if (type === 'err')
					_stderr += `${log}\n`;
				else
					_stdout += `${log}\n`;

				if (!log.includes(uniqueKey))
					return true;

				const match = log.match(regexp);
				if (!match)
					return true;

				const exitCode = match?.[1];
				this.removeLogProcessor(logProcessor);

				try {
					resolve(callback?.(_stdout, _stderr, +exitCode)!);
				} catch (err: any) {
					reject(err);
				}

				return false;
			};
			this.builder.append(`echo ${uniqueKey}=$?`);
			const command = this.builder.reset();

			this.shell.addLogProcessor(logProcessor);
			this.shell.execute(command);
		});
	}

	/**
	 * Adds a log processor to the shell.
	 * @param {Function} processor - The log processor function to add.
	 * @returns {this} - The CommandoInteractive instance for method chaining.
	 */
	addLogProcessor(processor: (log: string, std: LogTypes) => boolean) {
		this.shell.addLogProcessor(processor);
		return this;
	}

	/**
	 * Removes a log processor from the shell.
	 * @param {Function} processor - The log processor function to remove.
	 * @returns {this} - The CommandoInteractive instance for method chaining.
	 */
	removeLogProcessor(processor: (log: string, std: LogTypes) => boolean) {
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
}
