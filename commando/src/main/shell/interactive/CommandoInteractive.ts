import {AsyncVoidFunction, Constructor, generateHex, LogLevel} from '@nu-art/ts-common';
import {InteractiveShell} from './InteractiveShell';
import {LogTypes} from '../types';
import {BaseCommando} from '../core/BaseCommando';


export class CommandoInteractive
	extends BaseCommando {

	private shell: InteractiveShell;

	static create<T extends Constructor<any>[]>(...plugins: T) {
		const _commando = BaseCommando._create(CommandoInteractive, ...plugins);
		const commando = _commando as typeof _commando & CommandoInteractive;
		commando.shell = new InteractiveShell();
		commando.shell.setMinLevel(LogLevel.Verbose);
		return commando;
	}

	constructor() {
		super();
		this.shell = new InteractiveShell();
	}

	debug(debug?: boolean) {
		this.shell.debug(debug);
		return this;
	}

	setUID(uid: string) {
		this.shell.setUID(uid);
		return this;
	}

	close(cb?: AsyncVoidFunction) {
		this.shell.endInteractive(cb);
		return this;
	}

	kill(signal?: NodeJS.Signals | number) {
		return this.shell.kill(signal);
	}

	async gracefullyKill(pid?: number) {
		console.log('Commando Inter calling gracefullyKill');
		await this.shell.gracefullyKill(pid);
	}

	awaitForLog(filter: string | RegExp, callback: (match: RegExpMatchArray) => any) {
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

	async execute<T>(callback?: (stdout: string, stderr: string, exitCode: number) => T): Promise<T> {
		return await new Promise<T>((resolve, reject) => {
			const uniqueKey = generateHex(16);
			const regexp = new RegExp(`${uniqueKey}=(\\d+)`);

			this.builder.append(`echo ${uniqueKey}=$?`);
			const command = this.builder.reset();

			let _stderr = '';
			let _stdout = '';
			const stdoutProcessor = (log: string, type: LogTypes) => {
				if (type === 'err')
					_stderr += `${log}`;
				else
					_stdout += `${log}`;

				if (!log.includes(uniqueKey))
					return true;

				const match = log.match(regexp);
				if (!match)
					return true;

				const exitCode = match?.[1];
				console.log(`handling exitCode: ${exitCode}`);
				this.removeLogProcessor(stdoutProcessor);

				try {
					resolve(callback?.(_stdout, _stderr, +exitCode)!);
				} catch (err: any) {
					reject(err);
				}

				console.log(`is this code even reachable??`);
				return false;
			};

			this.shell.addLogProcessor(stdoutProcessor);
			this.shell.execute(command);
		});

	}

	addLogProcessor(processor: (log: string, std: LogTypes) => boolean) {
		this.shell.addLogProcessor(processor);
		return this;
	}

	removeLogProcessor(processor: (log: string, std: LogTypes) => boolean) {
		this.shell.removeLogProcessor(processor);
		return this;
	}

	append(command: string) {
		this.builder.append(command);
		return this;
	}

}

