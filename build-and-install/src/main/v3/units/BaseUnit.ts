import {
	_logger_finalDate,
	_logger_getPrefix,
	_logger_timezoneOffset,
	AsyncVoidFunction,
	BeLogged,
	Constructor,
	exists,
	LogClient_MemBuffer,
	Logger,
	LogLevel,
	removeItemFromArray,
	TimeCounter,
	timeCounter
} from '@nu-art/ts-common';
import {dispatcher_PhaseChange, dispatcher_UnitStatusChange} from '../../v2/phase-runner/PhaseRunnerDispatcher';
import {CommandoInteractive} from '@nu-art/commando/shell';
import {BaseCommando} from '@nu-art/commando/shell/core/BaseCommando';
import {MergeTypes} from '@nu-art/commando/shell/core/class-merger';
import {Commando_Basic} from '@nu-art/commando/shell/plugins/basic';
import {BAI_Config} from '../../core/types';


export type BaseUnit_Config = {
	key: string;
	label: string;
}

export abstract class BaseUnit<C extends BaseUnit_Config = BaseUnit_Config>
	extends Logger {

	readonly config: Readonly<C>;
	private unitStatus: string = 'Pending Initialization';
	protected logger!: LogClient_MemBuffer;
	private classStack: Set<string>;
	private processTerminator: AsyncVoidFunction[] = [];
	private timeCounter?: TimeCounter;
	protected baiConfig!: Readonly<BAI_Config>;

	protected constructor(config: C) {
		super(config.key);
		this.config = Object.freeze(config);
		this.classStack = new Set<string>();
		this.addToClassStack(BaseUnit);
		this.initLogClient();
	}

	setProjectConfig(baiConfig: Readonly<BAI_Config>) {
		this.baiConfig = baiConfig;
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
		this.setStatus(status, 'end', LogLevel.Error);
		this.logError(error);
	}

	protected setStatus(status: string, type?: 'start' | 'end', logLevel: LogLevel = LogLevel.Info) {
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

		this.log(logLevel, false, [`Unit status update: ${this.unitStatus} => ${status}${operationDuration}`]);
		this.unitStatus = `${status}${operationDuration}`;

		dispatcher_UnitStatusChange.dispatch(this);
	}

	protected addToClassStack = (cls: Function) => {
		this.classStack.add(cls.name);
	};

	public isInstanceOf = (cls: Function) => {
		return this.classStack.has(cls.name);
	};

	public getStatus() {
		return this.unitStatus;
	}

	public async kill() {
		if (!this.processTerminator.length)
			return this.setStatus('Killed');

		const processTerminator = [...this.processTerminator];
		this.processTerminator.length = 0;
		this.setStatus('Killing');
		try {
			await Promise.all(processTerminator.map(toTerminate => toTerminate()));
		} finally {
			this.setStatus('Killed');
		}
	}

	public getLogs() {
		return this.logger.buffers[0];
	}
}

