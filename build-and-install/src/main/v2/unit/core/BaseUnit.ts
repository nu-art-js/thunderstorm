import {_logger_finalDate, _logger_getPrefix, _logger_timezoneOffset, BeLogged, LogClient_MemBuffer, Logger, LogLevel} from '@nu-art/ts-common';
import {MemKey_RunnerParams, RunnerParamKey} from '../../phase-runner/RunnerParams';

type _Config<Config> = {
	key: string;
	label: string;
	filter?: () => boolean | Promise<boolean>;
} & Config;

export class BaseUnit<Config extends {} = {}, C extends _Config<Config> = _Config<Config>>
	extends Logger {

	readonly config: Readonly<C>;
	private unitStatus?: string;

	constructor(config: C) {
		super(config.key);
		this.config = Object.freeze(config);
		this.initLogClient();
	}

	protected async init() {
		//Inheritor classes should define their own init
	}

	//######################### Internal Logic #########################

	protected getRunnerParam(key: RunnerParamKey) {
		return MemKey_RunnerParams.get({})[key];
	}

	private initLogClient() {
		const logClient = new LogClient_MemBuffer(this.tag);
		logClient.setForTerminal();
		logClient.setComposer((tag: string, level: LogLevel): string => {
			_logger_finalDate.setTime(Date.now() - _logger_timezoneOffset);
			const date = _logger_finalDate.toISOString().replace(/T/, '_').replace(/Z/, '').substring(0, 23).split('_')[1];
			return `${date} ${_logger_getPrefix(level)}:  `;
		});

		logClient.setFilter((level, tag) => {
			return tag === this.tag;
		});
		BeLogged.addClient(logClient);
	}

	protected setStatus(status?: string) {
		this.unitStatus = status;
	}

	//######################### Public Functions #########################

	public getStatus() {
		return this.unitStatus;
	}
}