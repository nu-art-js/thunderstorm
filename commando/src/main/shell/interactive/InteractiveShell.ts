import {AsyncVoidFunction, Logger, removeItemFromArray} from '@nu-art/ts-common';
import {ChildProcess, ChildProcessWithoutNullStreams, spawn} from 'node:child_process';
import {LogTypes} from '../types';


export class InteractiveShell
	extends Logger {

	private _debug: boolean = false;
	private logProcessors: ((log: string, std: LogTypes) => boolean)[] = [];
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

		const printer = (std: LogTypes) => (data: Buffer) => {
			const messages = data.toString().trim().split('\n');
			if (!messages.length)
				return;

			for (const message of messages) {
				try {
					const toPrint = this.logProcessors.length === 0 || this.logProcessors.reduce((toPrint, processor) => {
						const filter = processor(message, std);
						return toPrint && filter;
					}, true);

					if (toPrint)
						this.logInfo(`${message}`);

				} catch (e: any) {
					this.logError(e);
				}
			}
		};

		this.shell.stdout?.on('data', printer('out'));
		this.shell.stderr?.on('data', printer('err'));

		// Handle shell errors (stderr)
		this.shell.on('data', printer);

		// Handle shell exit
		this.shell.on('close', (code) => {
			this.alive = false;
			this.logInfo(`child process exited with code ${code}`);
		});
	}

	debug(debug?: boolean) {
		this._debug = debug ?? !this._debug;
		return this._debug;
	}

	execute = (command: string) => {
		if (this._debug)
			this.logDebug(`executing: `, `"""\n${command}\n"""`);

		this.shell.stdin?.write(command + '\n', 'utf-8', (err?: Error | null) => {
			if (err)
				this.logError(`error`, err);
		});
	};

	endInteractive = (cb?: AsyncVoidFunction) => {
		this.shell.stdin?.end(cb);
	};

	kill = (signal?: NodeJS.Signals | number) => {
		if (!this.alive)
			return;

		return this.shell.kill(signal);
	};

	gracefullyKill = async (pid?: number) => {
		if (!this.alive)
			return;

		return new Promise<void>((resolve, reject) => {
			console.log('Killing process');
			this.shell.on('exit', async (code, signal) => {
				console.log(`Process Killed ${signal}`);
				resolve();
			});

			if (pid) {
				console.log(`KILLING PID: ${pid}`);
				process.kill(pid, 'SIGINT');
			} else {
				console.log(`KILLING SHELL WITH SIGINT`);
				this.shell.kill('SIGINT');
			}

		});
	};

	addLogProcessor(processor: (log: string, std: LogTypes) => boolean) {
		this.logProcessors.push(processor);
		return this;
	}

	removeLogProcessor(processor: (log: string, std: LogTypes) => boolean) {
		removeItemFromArray(this.logProcessors, processor);
		return this;
	}

	setUID(uid: string) {
		this.setTag(uid);
		return this;
	}
}
