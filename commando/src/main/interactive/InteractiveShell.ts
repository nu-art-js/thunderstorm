/*
 * commando provides shell command execution framework with interactive sessions and plugin system
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {addItemToArrayAtIndex, currentTimeMillis, generateHex, Logger, LogLevel, removeItemFromArray} from '@nu-art/ts-common';
import {ChildProcess, ChildProcessWithoutNullStreams, spawn} from 'node:child_process';
import {LogTypes} from '../types.js';


/**
 * Function that processes log messages from shell output.
 *
 * Returns `false` to consume the log (prevent default logging),
 * `true` to continue processing, or a Promise resolving to boolean.
 *
 * Processors are called in order until one returns `false`.
 */
export type ShellLogProcessor = (log: string, std: LogTypes) => (Promise<boolean> | boolean);

/**
 * Function called when a subprocess PID is detected.
 *
 * Used with `appendAsync()` to notify when a background process starts.
 */
export type ShellPidListener = (pid: number) => (Promise<any> | any);

/**
 * Default log level filter: Error for stderr, Info for stdout.
 */
const defaultLogLevelFilter = (log: string, std: LogTypes) => std === 'err' ? LogLevel.Error : LogLevel.Info;

/**
 * Listener called when the shell process closes.
 */
type OnCloseListener = (exitCode: number) => void;

/**
 * Interactive shell session manager using Node.js child_process spawn.
 *
 * Maintains a persistent bash session and provides:
 * - Command execution in the same shell context
 * - Log processing pipeline (multiple processors)
 * - Subprocess management (PID tracking, killing)
 * - Exit code extraction via echo commands
 *
 * **Key Features**:
 * - Detached process (session leader) for proper signal handling
 * - Log processors can consume or pass through messages
 * - Automatic log level filtering (stderr=Error, stdout=Info)
 * - PID tracking for background processes
 * - Graceful shutdown with timeout
 *
 * **Process Management**:
 * - Spawns `/bin/bash` as detached process
 * - Removes NODE_OPTIONS to prevent debug flags from propagating
 * - Tracks process lifecycle (alive state)
 * - Supports killing main shell or subprocesses independently
 */
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

// Check if a given PID is alive
	isAlive = (pid: number): boolean => {
		try {
			process.kill(pid, 0); // Non-intrusive check
			return true;
		} catch {
			return false;
		}
	};

// Poll until a PID is no longer alive or timeout is hit
	waitForExit = (pid: number, timeout = 20000, sampleInterval = 100): Promise<void> => {
		const startTime = currentTimeMillis();

		return new Promise((resolve, reject) => {
			this.logInfo(`Killing process (${pid}-${timeout}/${sampleInterval})`);
			const check = () => {
				if (!this.isAlive(pid))
					return resolve();

				if (currentTimeMillis() - startTime > timeout) {
					this.logWarning(`PID ${pid} did not exit in time. Sending 'SIGTERM'.`);
					try {
						process.kill(pid, 'SIGTERM');
					} catch (e: any) {
						this.logError(`Failed to send 'SIGTERM' to PID ${pid}`, e);
					}

					return reject(new Error(`PID ${pid} did not exit after ${timeout}ms`));
				}

				setTimeout(check, sampleInterval);
			};
			check();
		});
	};

// Kill the main shell process (interactive shell)
	kill = async (signal: NodeJS.Signals = 'SIGINT', timeout = 10000): Promise<void> => {
		if (!this.alive)
			return;

		this.logWarning(`Sending ${signal} to shell PID: ${this.shell.pid}`);

		try {
			this.shell.kill(signal);
		} catch (e: any) {
			this.logError(`Failed to send ${signal} to shell`, e);
			throw e;
		}

		await this.waitForExit(this.shell.pid!, timeout);
		this.logWarning(`Shell process PID ${this.shell.pid} terminated`);
	};

// Kill a background subprocess PID without affecting the shell
	killSubprocess = async (pid: number, signal: NodeJS.Signals = 'SIGINT', timeout = 10000): Promise<void> => {
		if (!this.isAlive(pid)) {
			this.logDebug(`Subprocess PID ${pid} already exited`);
			return;
		}

		this.logWarning(`Sending ${signal} to subprocess PID: ${pid}`);

		try {
			process.kill(pid, signal);
		} catch (e: any) {
			this.logError(`Failed to send ${signal} to subprocess`, e);
			throw e;
		}

		await this.waitForExit(pid, timeout);
		this.logWarning(`Subprocess PID ${pid} terminated`);
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
