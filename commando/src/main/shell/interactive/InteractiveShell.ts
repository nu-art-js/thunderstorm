import {addItemToArrayAtIndex, currentTimeMillis, generateHex, Logger, LogLevel, removeItemFromArray} from '@nu-art/ts-common';
import {ChildProcess, ChildProcessWithoutNullStreams, spawn} from 'node:child_process';
import {LogTypes} from '../types';


export type ShellLogProcessor = (log: string, std: LogTypes) => (Promise<boolean> | boolean);
export type ShellPidListener = (pid: number) => (Promise<any> | any);


const defaultLogLevelFilter = (log: string, std: LogTypes) => std === 'err' ? LogLevel.Error : LogLevel.Info;

type OnCloseListener = (exitCode: number) => void;

export class InteractiveShell
	extends Logger {

	private _debug: boolean = false;
	private logProcessors: (ShellLogProcessor)[] = [];
	private onCloseListeners: (OnCloseListener)[] = [];
	private shell: ChildProcessWithoutNullStreams | ChildProcess;
	private alive: boolean;
	private logLevelFilter: (log: string, std: LogTypes) => LogLevel | undefined = defaultLogLevelFilter;

	/**
	 * Constructs an InteractiveShell instance, initializes a detached shell session, and sets up log processors.
	 */
	constructor() {
		super();
		this.setTag(`${this.constructor['name']}(${generateHex(4)})`);
		this.shell = spawn('/bin/bash', {
			detached: true,  // This is important to make the process a session leader
			shell: true,
			env: {
				...process.env,
				NODE_OPTIONS: ''   // Remove any --inspect flags
			}
		});

		this.alive = true;

		const printer = (std: LogTypes) => async (data: Buffer) => {
			const messages = data.toString().trim().split('\n');
			if (!messages.length)
				return;

			for (const message of messages) {
				try {
					let consumed = false;

					for (const processor of this.logProcessors) {
						const result = await processor(message, std);
						if (!result) {
							consumed = true;
							break;
						}
					}

					if (!consumed) {
						const logLevel = this.logLevelFilter(message, std) ?? defaultLogLevelFilter(message, std);
						this.log(logLevel, false, [message]);
					}
				} catch (e: any) {
					this.logError(e);
				}
			}
		};

		const stdoutPrinter = printer('out');
		const stderrPrinter = printer('err');
		this.shell.stdout?.on('data', stdoutPrinter);
		this.shell.stderr?.on('data', stderrPrinter);

		// Handle shell exit
		this.shell.on('close', async (code) => {
			this.alive = false;
			code = code === null ? -1 : code;
			this.onCloseListeners.forEach(listener => listener(code === null ? -1 : code));

			const printer = code === 0 ? stdoutPrinter : stderrPrinter;
			const string = `Process exited with code: ${code}`;
			printer(Buffer.from(string));
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
		this.logVerbose(`executing: `, `"""\n${command}\n"""`);

		this.shell.stdin?.write(command + '\n', 'utf-8', (err?: Error | null) => {
			if (err)
				this.logError(`error`, err);
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

	kill = async (signal: NodeJS.Signals = 'SIGINT') => {
		if (!this.alive)
			return;

		return new Promise<void>((resolve, reject) => {
			this.shell.on('exit', async (code, signal) => {
				this.logWarning(`Process Killed with ${signal}${code ? `(${code})` : ''}`);
				resolve();
			});

			this.shell.kill(signal);
			this.logWarning(`KILLED SHELL WITH ${signal}`);
		});
	};

	isAlive = (pid: number, signal: NodeJS.Signals = 'SIGINT') => {
		try {
			this.logError(`killing pid ${pid}`);
			process.kill(pid, signal); // throws if not alive
			return true;
		} catch (e: any) {
			this.logWarning(`PID: ${pid} KILLED WITH ${signal}`, e);
			return false;
		}
	};

	killSubprocess = async (pid: number, signal: NodeJS.Signals = 'SIGINT', waitTimeout = 10000, sampleInterval = 100) => {
		if (!this.alive)
			return;

		const startTime = currentTimeMillis();
		return new Promise<void>((resolve, reject) => {
			const check = () => {
				if (!this.isAlive(pid, signal))
					return resolve();

				if (currentTimeMillis() - startTime > waitTimeout)
					return reject(new Error(`pid ${pid} did not exit after ${waitTimeout}ms`));

				setTimeout(check, sampleInterval);
			};
			check();
		});
	};

	/**
	 * Adds a log processor to handle log messages.
	 * @param {(log: string, std: LogTypes) => boolean} processor - The log processor function.
	 * @param index -
	 * @returns {this} - The InteractiveShell instance for method chaining.
	 */
	addLogProcessor(processor: ShellLogProcessor, index = this.logProcessors.length) {
		addItemToArrayAtIndex(this.logProcessors, processor, index);
		return this;
	}

	setLogLevelFilter(logLevelFilter: (log: string, std: LogTypes) => LogLevel | undefined) {
		this.logLevelFilter = logLevelFilter;
		return this;
	}

	addOnCloseListener(listener: OnCloseListener) {
		this.onCloseListeners.push(listener);
		return this;
	}

	removeOnCloseListener(listener: OnCloseListener) {
		removeItemFromArray(this.onCloseListeners, listener);
		return this;
	}


	/**
	 * Removes a log processor from handling log messages.
	 * @param {(log: string, std: LogTypes) => boolean} processor - The log processor function to remove.
	 * @returns {this} - The InteractiveShell instance for method chaining.
	 */
	removeLogProcessor(processor: ShellLogProcessor) {
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
