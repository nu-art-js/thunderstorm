import {_logger_getPrefix, LogClient} from './LogClient';
import {LogLevel, LogParam} from './types';
import {debounce} from '../../utils/ui-tools';
import {Minute, Second, sleep} from '../../utils/date-time-tools';
import {__stringify} from '../../utils/tools';
import {filterInstances} from '../../utils/array-tools';

export type LogToStream = {
	severity: LogLevel,
	logContent: string,
	reporter: string,
	timestamp: string,
};

export abstract class LogClient_ConsoleProxy
	extends LogClient {
	private buffers: LogToStream[];
	private readonly maxBuffers: number = 50;
	private readonly flushLogsDebounced!: () => void;
	private readonly originalConsoleError!: any;
	private activeRequest: boolean;
	private errorLogTimeout?: NodeJS.Timeout;

	// implement app name in app level classes
	protected abstract appName: string;

	constructor() {
		super();
		this.buffers = [];
		this.activeRequest = false;

		// pipe console.error to this log client
	}

	init() {
		super.init();
		// @ts-ignore
		this.originalConsoleError = console.error;

		console.error = (...args: any[]) => {
			this.originalConsoleError(...args);
			this.logMessage.bind(this)(LogLevel.Error, false, `${new Date().toISOString()} ${_logger_getPrefix(LogLevel.Error)} unhandled error`, args);
		};

		const flushLogsDebounced = debounce(this.flushLogs.bind(this), Minute, 2 * Minute);
		// @ts-ignore
		this.flushLogsDebounced = flushLogsDebounced;
	}

	protected logMessage(level: LogLevel, bold: boolean, prefix: string, toLog: LogParam[]) {
		const levelPrefix = _logger_getPrefix(level);
		const logs: LogToStream[] = filterInstances(toLog.map(param => {
			if (!param)
				return;

			let logContent = '';
			if (typeof param === 'object')
				logContent = __stringify(param as object);
			else
				logContent = param.toString();

			const [timestamp, reporter] = prefix.split(levelPrefix);
			return {
				severity: level,
				logContent: logContent.trim(),
				reporter: reporter.trim(),
				timestamp: timestamp.trim()
			};
		}));

		this.buffers.push(...logs);

		if (this.buffers.length >= this.maxBuffers && !this.activeRequest) {
			this.flushLogs();
		} else {

			// trigger flush on error
			if (level === LogLevel.Error && !this.errorLogTimeout)
				this.errorLogTimeout = setTimeout(() => {
					this.errorLogTimeout = undefined;

					if (!this.activeRequest)
						this.flushLogs();
				}, 500);

			this.flushLogsDebounced();
		}
	}

	private async flushLogs() {
		this.activeRequest = true;
		const logsToSend = this.buffers.splice(0, this.maxBuffers);
		await this.retrySendLogs(logsToSend);
		this.activeRequest = false;
	}

	private async retrySendLogs(logs: LogToStream[], retries: number = 10) {
		for (let attempt = 1; attempt <= retries; attempt++) {
			try {
				await this.sendLogsToEndpoint(logs);
				return;
			} catch (error) {
				if (attempt === retries) {
					this.originalConsoleError('Failed to send logs after multiple attempts', error);
				} else {
					console.warn(`Retrying to send logs, attempt ${attempt} failed`, error);
					await sleep(Second); // add a bit of delay between retries
				}
			}
		}
	}

	protected abstract sendLogsToEndpoint: (logs: LogToStream[]) => Promise<void>;

}