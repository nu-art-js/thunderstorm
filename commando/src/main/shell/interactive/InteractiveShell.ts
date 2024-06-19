import {Logger, LogLevel, removeItemFromArray} from '@nu-art/ts-common';
import {ChildProcess, ChildProcessWithoutNullStreams, spawn} from 'node:child_process';
import {LogTypes} from '../types';


type LogProcessor = (log: string, std: LogTypes) => boolean;

export class InteractiveShell
	extends Logger {

	private _debug: boolean = false;
	private logProcessors: (LogProcessor)[] = [];
	private shell: ChildProcessWithoutNullStreams | ChildProcess;
	private alive: boolean;
	private logLevelFilter: (log: string, std: LogTypes) => LogLevel = (log: string, std: LogTypes) => std === 'err' ? LogLevel.Error : LogLevel.Info;

	/**
	 * Constructs an InteractiveShell instance, initializes a detached shell session, and sets up log processors.
	 */
	constructor() {
		super();
		this.shell = spawn('/bin/bash', {
			detached: true,  // This is important to make the process a session leader
			shell: true
		});

		this.alive = true;

		const printer = (std: LogTypes) => (data: Buffer) => {
			const messages = data.toString().trim().split('\n');
			if (!messages.length) return;

			for (const message of messages) {
				try {
					const toPrint = this.logProcessors.length === 0 || this.logProcessors.reduce((toPrint, processor) => {
						const filter = processor(message, std);
						return toPrint && filter;
					}, true);

					if (toPrint) {
						const logLevel = this.logLevelFilter(message, std);
						this.log(logLevel, false, [message]);
					}

				} catch (e: any) {
					this.logError(e);
				}
			}
		};

		this.shell.stdout?.on('data', printer('out'));
		this.shell.stderr?.on('data', printer('err'));

		// Handle shell exit
		this.shell.on('close', (code) => {
			this.alive = false;
			this.logInfo(`child process exited with code ${code}`);
		});
	}

	/**
	 * Toggles or sets the debug mode.
	 * @param {boolean} [debug] - If provided, sets the debug mode to this value. Otherwise, toggles the current debug mode.
	 * @returns {boolean} - The current state of debug mode.
	 */
	debug(debug?: boolean) {
		this._debug = debug ?? !this._debug;
		return this;
	}

	/**
	 * Executes a command in the interactive shell.
	 * @param {string} command - The command to execute.
	 */
	execute = (command: string) => {
		if (this._debug)
			this.logDebug(`executing: `, `"""\n${command}\n"""`);

		this.shell.stdin?.write(command + '\n', 'utf-8', (err?: Error | null) => {
			if (err) this.logError(`error`, err);
		});
	};

	/**
	 * Awaits for the end of the interactive shell session.
	 */
	endInteractive = () => {
		return new Promise<void>(resolve => {
			this.shell.stdin?.end(resolve);
		});
	};

	/**
	 * Sends a signal to terminate the shell process.
	 * @param {NodeJS.Signals | number} [signal] - The signal to send to the shell process.
	 * @returns {boolean | undefined} - The result of the kill operation.
	 */
	kill = (signal?: NodeJS.Signals | number) => {
		if (!this.alive)
			return;

		this.logWarning(`Killing......`);
		// return this.gracefullyKill(this.shell.pid);
		return this.shell.emit('exit', 2);
	};

	/**
	 * Attempts to gracefully terminate the shell process.
	 * @param {number} [pid] - Process ID of the shell to terminate.
	 * @returns {Promise<void>} - Resolves when the shell process is gracefully killed.
	 */
	gracefullyKill = async (pid?: number) => {
		if (!this.alive)
			return;

		return new Promise<void>((resolve, reject) => {
			this.logWarning('Killing process');
			this.shell.on('exit', async (code, signal) => {
				this.logWarning(`Process Killed ${signal}`);
				resolve();
			});

			if (pid) {
				this.logWarning(`KILLING PID: ${pid}`);
				process.kill(pid, 'SIGINT');
			} else {
				this.logWarning(`KILLING SHELL WITH SIGINT`);
				this.shell.kill('SIGINT');
			}
		});
	};

	/**
	 * Adds a log processor to handle log messages.
	 * @param {(log: string, std: LogTypes) => boolean} processor - The log processor function.
	 * @returns {this} - The InteractiveShell instance for method chaining.
	 */
	addLogProcessor(processor: LogProcessor) {
		this.logProcessors.push(processor);
		return this;
	}

	setLogLevelFilter(logLevelFilter: (log: string, std: LogTypes) => LogLevel) {
		this.logLevelFilter = logLevelFilter;
		return this;
	}

	/**
	 * Removes a log processor from handling log messages.
	 * @param {(log: string, std: LogTypes) => boolean} processor - The log processor function to remove.
	 * @returns {this} - The InteractiveShell instance for method chaining.
	 */
	removeLogProcessor(processor: LogProcessor) {
		removeItemFromArray(this.logProcessors, processor);
		return this;
	}

	/**
	 * Sets a unique identifier for the shell session.
	 * @param {string} uid - The unique identifier.
	 * @returns {this} - The InteractiveShell instance for method chaining.
	 */
	setUID(uid: string) {
		this.setTag(uid);
		return this;
	}
}
