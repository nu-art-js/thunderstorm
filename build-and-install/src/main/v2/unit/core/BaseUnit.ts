import {
	_logger_finalDate,
	_logger_getPrefix,
	_logger_timezoneOffset,
	AsyncVoidFunction,
	BeLogged,
	Constructor,
	currentTimeMillis,
	exists,
	Hour,
	LogClient_MemBuffer,
	Logger,
	LogLevel,
	Minute,
	removeItemFromArray,
	Second
} from '@nu-art/ts-common';
import {MemKey_RunnerParams, RunnerParamKey} from '../../phase-runner/RunnerParams';
import {dispatcher_PhaseChange, dispatcher_UnitStatusChange} from '../../phase-runner/PhaseRunnerDispatcher';
import {CommandoInteractive} from '@nu-art/commando/shell';
import {BaseCommando} from '@nu-art/commando/shell/core/BaseCommando';
import {MergeTypes} from '@nu-art/commando/shell/core/class-merger';
import {Commando_Basic} from '@nu-art/commando/shell/plugins/basic';


export type BaseUnit_Config = {
	key: string;
	label: string;
	filter?: () => boolean | Promise<boolean>;
}

export type BaseUnit_RuntimeConfig = {
	dependencyName: string;
	unitDependencyNames: string[];
}

export class BaseUnit<C extends BaseUnit_Config = BaseUnit_Config, RTC extends BaseUnit_RuntimeConfig = BaseUnit_RuntimeConfig>
	extends Logger {

	readonly config: Readonly<C>;
	readonly runtime: RTC;
	private unitStatus: string = 'Pending Initialization';
	private logger!: LogClient_MemBuffer;
	private classStack: Set<string>;
	private processTerminator: AsyncVoidFunction[] = [];
	private timeCounter?: TimeCounter;

	constructor(config: C) {
		super(config.key);
		this.config = Object.freeze(config);
		this.runtime = {
			dependencyName: this.config.key,
			unitDependencyNames: [] as string[],
		} as RTC;
		this.classStack = new Set<string>();
		this.addToClassStack(BaseUnit);
		this.initLogClient();
	}

	registerTerminatable(terminatable: AsyncVoidFunction) {
		this.processTerminator.push(terminatable);
	}

	unregisterTerminatable(terminatable: AsyncVoidFunction) {
		removeItemFromArray(this.processTerminator, terminatable);
	}

	allocateCommando<T extends Constructor<any>[]>(...plugins: T): MergeTypes<[...T]> & CommandoInteractive & BaseCommando & Commando_Basic {
		const commando = CommandoInteractive.create(...plugins, Commando_Basic) as unknown as MergeTypes<[...T]> & CommandoInteractive & BaseCommando & Commando_Basic;
		commando.setUID(this.config.key);
		return commando;
	}

	async executeAsyncCommando<T>(commando: CommandoInteractive, callback?: (stdout: string, stderr: string, exitCode: number) => T) {
		let pid: number;

		const terminatable = () => commando.gracefullyKill(pid);
		try {
			this.registerTerminatable(terminatable);
			return await commando.executeAsync(_pid => pid = _pid, callback);
		} finally {
			this.unregisterTerminatable(terminatable);
		}
	}

	protected async init(setInitialized: boolean = true) {
		this.setStatus('Initializing');
		//Register the unit to PhaseRunnerEvent dispatcher
		dispatcher_PhaseChange.addListener(this);
		dispatcher_UnitStatusChange.addListener(this);
		if (setInitialized)
			this.setStatus('Initialized');
	}

	//######################### Internal Logic #########################

	protected getRunnerParam(key: RunnerParamKey) {
		return MemKey_RunnerParams.get({})[key];
	}

	private initLogClient() {
		this.logger = new LogClient_MemBuffer(this.tag);
		this.logger.keepLogsNaturalColors();
		this.logger.setComposer((tag: string, level: LogLevel): string => {
			_logger_finalDate.setTime(Date.now() - _logger_timezoneOffset);
			const date = _logger_finalDate.toISOString().replace(/T/, '_').replace(/Z/, '').substring(0, 23).split('_')[1];
			return `${date} ${_logger_getPrefix(level)}:  `;
		});

		this.logger.setFilter((level, tag) => {
			return tag === this.tag;
		});
		BeLogged.addClient(this.logger);
	}

	protected setErrorStatus(status: string, error: Error) {
		this.setStatus(status, 'end');
		this.logError(error);
	}

	protected setStatus(status: string, type?: 'start' | 'end') {
		let operationDuration: string | undefined = '';
		if (type === 'start')
			this.timeCounter = timeCounter();

		if (type === 'end')
			if (!exists(this.timeCounter))
				this.logError(`Got end status: '${status}' - while current status '${this.unitStatus}' was not a start`);
			else {
				operationDuration = ` (${this.timeCounter.format('mm:ss')})`;
				delete this.timeCounter;
			}

		this.logInfo(`Unit status update: ${this.unitStatus} => ${status}${operationDuration}`);
		this.unitStatus = `${status}${operationDuration}`;

		dispatcher_UnitStatusChange.dispatch(this);
	}

	//######################### Class Stack Logic #########################

	protected addToClassStack = (cls: Function) => {
		this.classStack.add(cls.name);
	};

	public isInstanceOf = (cls: Function) => {
		return this.classStack.has(cls.name);
	};

	//######################### Public Functions #########################

	public getStatus() {
		return this.unitStatus;
	}

	public async kill() {
		if (!this.processTerminator.length)
			return this.setStatus('Killed');

		this.setStatus('Killing');
		try {
			await Promise.all(this.processTerminator.map(toTerminate => toTerminate()));
		} finally {
			this.setStatus('Killed');
		}
	}

	public getLogs() {
		return this.logger.buffers[0];
	}
}

type TimeCounter = { dt: () => number; format: (format: string) => string };

function timeCounter() {
	const started = currentTimeMillis();
	return {
		dt: () => currentTimeMillis() - started,
		format: (format: string) => {
			let dt = currentTimeMillis() - started;
			const hours = Math.floor(dt / Hour);
			dt -= hours * Hour;

			const minutes = Math.floor(dt / Minute);
			dt -= minutes * Minute;

			const seconds = Math.floor(dt / Second);
			dt -= seconds * Second;

			const millis = dt;
			return format
				.replace('hh', String(hours).padStart(2, '0'))
				.replace('mm', String(minutes).padStart(2, '0'))
				.replace('ss', String(seconds).padStart(2, '0'))
				.replace('zzz', String(millis).padStart(3, '0'));
		}
	};
}
