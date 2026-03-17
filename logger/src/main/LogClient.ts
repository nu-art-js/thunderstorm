/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {
	LogLevel,
	LogParam,
	LogPrefixComposer
} from './types.js';

/**
 * Filter function type for controlling which log messages are output.
 *
 * Returns true if the message should be logged, false to suppress it.
 */
export type LogFilter = (level: LogLevel, tag: string) => boolean;

/**
 * Abstract base class for all log client implementations.
 *
 * LogClient defines the interface for outputting log messages. Each implementation
 * handles the actual output mechanism (console, file, browser, etc.). The base class
 * provides:
 * - Prefix composition (timestamp, level, tag formatting)
 * - Filtering (optional per-client filtering)
 * - Lifecycle management (init/stop)
 *
 * Concrete implementations must override `logMessage()` to perform the actual output.
 *
 * @example
 * ```typescript
 * class CustomLogClient extends LogClient {
 *   protected logMessage(level: LogLevel, bold: boolean, prefix: string, ...toLog: LogParam[]) {
 *     // Custom output logic
 *     console.log(prefix, ...toLog);
 *   }
 * }
 * ```
 */
export abstract class LogClient {

	/** Function that composes the log prefix (timestamp, level, tag) */
	private prefixComposer: LogPrefixComposer = DefaultLogPrefixComposer;
	/** Optional filter function to suppress certain log messages */
	private filter: LogFilter = () => true;

	/**
	 * Abstract method that concrete implementations must override.
	 *
	 * Performs the actual output of the log message. The prefix is already composed,
	 * and filtering has already been applied.
	 *
	 * @param level - Log level
	 * @param bold - Whether to apply bold formatting
	 * @param prefix - Composed prefix string (timestamp, level indicator, tag)
	 * @param toLog - Array of values to log
	 */
	protected abstract logMessage(level: LogLevel, bold: boolean, prefix: string, toLog: LogParam[]): void;

	/**
	 * Sets a custom prefix composer for this log client.
	 *
	 * The composer function generates the prefix string that appears before each log message.
	 *
	 * @param logComposer - Function that generates the prefix from tag and level
	 */
	public setComposer(logComposer: LogPrefixComposer) {
		this.prefixComposer = logComposer;
	}

	/**
	 * Lifecycle hook called when the log client is added to BeLogged.
	 *
	 * Override to perform initialization (e.g., open files, set up connections).
	 */
	init() {
	}

	/**
	 * Lifecycle hook called when the log client is removed from BeLogged.
	 *
	 * Override to perform cleanup (e.g., close files, clean up resources).
	 */
	stop() {
	}

	/**
	 * Sets a filter function for this log client.
	 *
	 * The filter is applied before `logMessage()` is called. If the filter returns
	 * false, the message is not output by this client.
	 *
	 * @param filter - Function that returns true to log, false to suppress
	 * @returns This instance for method chaining
	 */
	setFilter(filter: LogFilter) {
		this.filter = filter;
		return this;
	}

	/**
	 * Logs a message through this client.
	 *
	 * Applies the filter, composes the prefix, and calls `logMessage()` if the
	 * message passes the filter.
	 *
	 * @param tag - Logger tag/identifier
	 * @param level - Log level
	 * @param bold - Whether to apply bold formatting
	 * @param toLog - Array of values to log
	 */
	public log(tag: string, level: LogLevel, bold: boolean, toLog: LogParam[]): void {
		if (!this.filter(level, tag))
			return;

		this.logMessage(level, bold, this.prefixComposer(tag, level), toLog);
	}
}

/**
 * Timezone offset in milliseconds, calculated once at module load.
 *
 * Used to adjust timestamps to local timezone in log prefixes.
 */
export const _logger_timezoneOffset: number = new Date().getTimezoneOffset() * 60000; //offset in milliseconds

/**
 * Reusable Date object for timestamp formatting (mutated, not recreated for performance).
 *
 * **Performance Note**: This Date object is mutated on every log call to avoid creating
 * new Date instances. This is safe in Node.js's single-threaded execution model but
 * would not be thread-safe in a multi-threaded environment.
 */
export const _logger_finalDate: Date = new Date();

/**
 * Array of log level prefix indicators.
 *
 * Maps log levels to their string representations: '---' (unknown), '-V-' (Verbose),
 * '-D-' (Debug), '-I-' (Info), '-W-' (Warning), '-E-' (Error).
 */
export const _logger_logPrefixes = ['---', '-V-', '-D-', '-I-', '-W-', '-E-'] as const;

/**
 * Gets the prefix indicator for a log level.
 *
 * @param level - Log level
 * @returns Prefix string ('-V-' for Verbose, '-D-' for Debug, etc.)
 */
export function _logger_getPrefix(level: LogLevel): typeof _logger_logPrefixes[number] {
	switch (level) {
		case LogLevel.Verbose:
			return '-V-';

		case LogLevel.Debug:
			return '-D-';

		case LogLevel.Info:
			return '-I-';

		case LogLevel.Warning:
			return '-W-';

		case LogLevel.Error:
			return '-E-';

		default:
			return '---';
	}
}

/**
 * Default prefix composer that generates timestamps and level indicators.
 *
 * Format: `  YYYY-MM-DD_HH:mm:ss.SSS -X- Tag:  `
 *
 * **Note**: Mutates the shared `_logger_finalDate` object for performance.
 * Uses timezone offset to adjust timestamps.
 */
export const DefaultLogPrefixComposer: LogPrefixComposer = (tag: string, level: LogLevel): string => {
	_logger_finalDate.setTime(Date.now() - _logger_timezoneOffset);
	const date = _logger_finalDate.toISOString().replace(/T/, '_').replace(/Z/, '').substring(0, 23);
	return `  ${date} ${_logger_getPrefix(level)} ${tag}:  `;
};


