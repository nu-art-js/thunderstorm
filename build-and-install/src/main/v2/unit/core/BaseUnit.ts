import {_logger_finalDate, _logger_getPrefix, _logger_timezoneOffset, BeLogged, LogClient_MemBuffer, Logger, LogLevel} from '@nu-art/ts-common';
import {MemKey_RunnerParams, RunnerParamKey} from '../../phase-runner/RunnerParams';
import {dispatcher_PhaseChange, dispatcher_UnitStatusChange} from '../../phase-runner/PhaseRunnerDispatcher';
import {RuntimeParams} from '../../../core/params/params';


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
	private unitStatus?: string;
	private logger!: LogClient_MemBuffer;
	private classStack: Set<string>;

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

	protected setStatus(status?: string) {
		this.unitStatus = status;
		if (RuntimeParams.allLogs)
			this.logInfo(`Unit status update: ${status}`);

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
		return;
	}

	public getLogs() {
		return this.logger.buffers[0];
	}
}