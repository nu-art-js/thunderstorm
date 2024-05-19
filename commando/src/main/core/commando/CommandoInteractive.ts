import {AsyncVoidFunction, Constructor, LogLevel} from '@nu-art/ts-common';
import {BaseCLI, BaseCommando} from './BaseCommando';
import {ChildProcess, ChildProcessWithoutNullStreams, spawn} from 'node:child_process';


export class CommandoInteractive
	extends BaseCommando<CliInteractive> {

	static create<T extends Constructor<any>[]>(...plugins: T) {
		const _commando = BaseCommando._create(CommandoInteractive, ...plugins);
		const commando = _commando as typeof _commando & CommandoInteractive;

		commando.cli = new CliInteractive();
		commando.cli.setMinLevel(LogLevel.Verbose);
		return commando;
	}

	close = (cb?: AsyncVoidFunction) => {
		this.cli.endInteractive(cb);
		return this;
	};
	kill = (signal?: NodeJS.Signals | number) => {
		return this.cli.kill(signal);
	};
	gracefullyKill = async (pid?: number) => {
		console.log('Commando Inter calling gracefullyKill');
		await this.cli.gracefullyKill(pid);
	};
	execute = () => this.cli.execute();
}

export class CliInteractive
	extends BaseCLI {

	private shell: ChildProcessWithoutNullStreams | ChildProcess;

	constructor() {
		super();
		this.shell = spawn('/bin/bash', {
			detached: true,  // This is important to make the process a session leader
			shell: true
		});

		// Handle shell output (stdout)
		const printer = (data: Buffer) => {
			const message = data.toString().trim();
			if (!message.length)
				return;

			this.stdoutProcessors.forEach(processor => processor(message));
			this.stderrProcessors.forEach(processor => processor(message));
			this.logInfo(`${message}`);
		};

		this.shell.stdout?.on('data', printer);

		this.shell.stderr?.on('data', printer);

		// Handle shell errors (stderr)
		this.shell.on('data', printer);

		// Handle shell exit
		this.shell.on('close', (code) => {
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
}
