/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {_logger_getPrefix, LogClient} from './LogClient.js';
import {LogLevel, LogParam} from './types.js';

/**
 * Structure for log entries sent to remote endpoints.
 *
 * Used by LogClient_ConsoleProxy and its subclasses to format log messages
 * before sending them to remote logging services.
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
 * - Periodic flushing via setInterval (every 2 minutes)
 *
 * Subclasses must implement `sendLogsToEndpoint()` to define the actual sending mechanism.
 */
export abstract class LogClient_ConsoleProxy
	extends LogClient {
	/** Buffer of log entries waiting to be sent */
	private buffers: LogToStream[];
	/** Maximum number of logs to buffer before forcing a flush */
	private readonly maxBuffers: number = 50;
	/** Interval handle for periodic log flushing */
	private flushInterval?: NodeJS.Timeout;
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
	 * Sets up periodic flushing via setInterval (every 2 minutes).
	 */
	init() {
		super.init();

		// Guard against multiple initializations - only save original if not already saved
		if (!this.originalConsoleError) {
			// @ts-ignore
			this['originalConsoleError'] = console.error;
		}

		console.error = (...args: any[]) => {
			this.originalConsoleError(...args);
			this.logMessage.bind(this)(LogLevel.Error, false, `${new Date().toISOString()} ${_logger_getPrefix(LogLevel.Error)} unhandled error`, args);
		};

		// Only set up interval if not already set
		if (!this.flushInterval) {
			// Flush logs every 60 seconds (not 2 minutes as comment says)
			this.flushInterval = setInterval(async () => {
				if (!this.activeRequest && this.buffers.length > 0)
					await this.flushLogs();
			}, 60 * 1000);
		}
	}

	/**
	 * Buffers log messages and triggers flushing when thresholds are met.
	 *
	 * Logs are converted to LogToStream format and added to the buffer. Flushing occurs:
	 * - Immediately if buffer reaches maxBuffers
	 * - After a short delay (500ms) for error-level logs
	 * - Periodically via setInterval (every 2 minutes)
	 *
	 * @param level - Log level
	 * @param bold - Whether to apply bold formatting (not used)
	 * @param prefix - Composed prefix string (parsed to extract timestamp and reporter)
	 * @param toLog - Array of values to log
	 */
	protected logMessage(level: LogLevel, bold: boolean, prefix: string, toLog: LogParam[]) {
		const levelPrefix = _logger_getPrefix(level);
		const logs: LogToStream[] = toLog
			.map(param => {
				if (!param)
					return null;

				let logContent = '';
				if (typeof param === 'object')
					logContent = JSON.stringify(param as object);
				else
					logContent = param.toString();

				const [timestamp, reporter] = prefix.split(levelPrefix);
				return {
					severity: level,
					logContent: logContent.trim(),
					reporter: reporter.trim(),
					timestamp: timestamp.trim()
				};
			})
			.filter((log): log is LogToStream => log != null);

		this.buffers.push(...logs);

		if (this.buffers.length >= this.maxBuffers && !this.activeRequest) {
			setTimeout(async () => {
				await this.flushLogs();
			}, 0); // 2 minutes
		} else {
			// trigger flush on error
			if (level === LogLevel.Error && !this.errorLogTimeout)
				this.errorLogTimeout = setTimeout(async () => {
					this.errorLogTimeout = undefined;

					if (!this.activeRequest)
						await this.flushLogs();
				}, 500);
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
					await new Promise(resolve => setTimeout(resolve, 1000)); // add a bit of delay between retries
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

	/**
	 * Stops the log client and performs cleanup.
	 *
	 * Clears any pending error log timeouts and flush intervals, restores the original
	 * console.error function, and calls the parent stop() method.
	 */
	stop() {
		if (this.errorLogTimeout) {
			clearTimeout(this.errorLogTimeout);
			this.errorLogTimeout = undefined;
		}

		if (this.flushInterval) {
			clearInterval(this.flushInterval);
			this.flushInterval = undefined;
		}

		if (this.originalConsoleError) {
			console.error = this.originalConsoleError;
		}

		super.stop();
	}
}