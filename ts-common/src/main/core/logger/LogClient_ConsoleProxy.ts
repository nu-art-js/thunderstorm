import {_logger_getPrefix, LogClient} from './LogClient.js';
import {LogLevel, LogParam} from './types.js';
import {debounce} from '../../utils/ui-tools.js';
import {Minute, Second, sleep} from '../../utils/date-time-tools.js';
import {__stringify} from '../../utils/tools.js';
import {filterInstances} from '../../utils/array-tools.js';

/**
 * Structure for log entries sent to remote endpoints.
 */
export type LogToStream = {
	/** Log severity level */
	severity: LogLevel,
	/** Formatted log content */
	logContent: string,
	/** Logger tag/reporter name */
	reporter: string,
	/** Timestamp string */
	timestamp: string,
};

/**
 * Abstract base class for log clients that proxy logs to remote endpoints.
 * 
 * Buffers log messages and sends them in batches to reduce network overhead.
 * Automatically intercepts `console.error` calls and includes them in the log stream.
 * 
 * Features:
 * - Batched sending (flushes when buffer reaches maxBuffers or after timeout)
 * - Automatic retry logic with exponential backoff
 * - Immediate flush on error-level logs
 * - Debounced periodic flushing
 * 
 * Subclasses must implement `sendLogsToEndpoint()` to define the actual sending mechanism.
 */
export abstract class LogClient_ConsoleProxy
	extends LogClient {
	/** Buffer of log entries waiting to be sent */
	private buffers: LogToStream[];
	/** Maximum number of logs to buffer before forcing a flush */
	private readonly maxBuffers: number = 50;
	/** Debounced function for periodic log flushing */
	private readonly flushLogsDebounced!: () => void;
	/** Original console.error function (saved before interception) */
	private readonly originalConsoleError!: any;
	/** Flag indicating if a send request is currently in progress */
	private activeRequest: boolean;
	/** Timeout handle for error log flushing */
	private errorLogTimeout?: NodeJS.Timeout;

	/**
	 * Application name - must be set by subclasses.
	 * Used to identify the source of logs in the remote system.
	 */
	protected abstract appName: string;

	/**
	 * Creates a new console proxy log client.
	 * 
	 * Sets up console.error interception and debounced flushing.
	 */
	constructor() {
		super();
		this.buffers = [];
		this.activeRequest = false;

		// pipe console.error to this log client
	}

	/**
	 * Initializes the log client by intercepting console.error and setting up flushing.
	 * 
	 * Intercepts all `console.error` calls and routes them through this log client.
	 * Sets up a debounced flush function that triggers periodically.
	 */
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

	/**
	 * Buffers log messages and triggers flushing when thresholds are met.
	 * 
	 * Logs are converted to LogToStream format and added to the buffer. Flushing occurs:
	 * - Immediately if buffer reaches maxBuffers
	 * - After a short delay (500ms) for error-level logs
	 * - Periodically via debounced flush (every 1-2 minutes)
	 * 
	 * @param level - Log level
	 * @param bold - Whether to apply bold formatting (not used)
	 * @param prefix - Composed prefix string (parsed to extract timestamp and reporter)
	 * @param toLog - Array of values to log
	 */
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

	/**
	 * Flushes buffered logs to the remote endpoint.
	 * 
	 * Removes up to maxBuffers logs from the buffer and sends them. Uses retry logic
	 * to handle transient network failures.
	 */
	private async flushLogs() {
		this.activeRequest = true;
		const logsToSend = this.buffers.splice(0, this.maxBuffers);
		await this.retrySendLogs(logsToSend);
		this.activeRequest = false;
	}

	/**
	 * Sends logs with retry logic.
	 * 
	 * Attempts to send logs up to 10 times with 1 second delay between retries.
	 * Logs errors to console if all retries fail.
	 * 
	 * @param logs - Log entries to send
	 * @param retries - Maximum number of retry attempts (default: 10)
	 */
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

	/**
	 * Abstract method that subclasses must implement to send logs to the remote endpoint.
	 * 
	 * @param logs - Array of log entries to send
	 */
	protected abstract sendLogsToEndpoint: (logs: LogToStream[]) => Promise<void>;

}