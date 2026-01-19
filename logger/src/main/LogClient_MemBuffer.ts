/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {LogClient_BaseRotate} from './LogClient_BaseRotate.js';
import {LogLevel, LogParam} from './types.js';
import {_logger_convertLogParamsToStrings, _logger_indentNewLineBy} from './utils.js';
import {NoColor} from './LogClient_Terminal.js';


function getColor(level: LogLevel, bold = false): string {
	let color;
	switch (level) {
		case LogLevel.Verbose:
			color = '\x1b[90m';
			break;

		case LogLevel.Debug:
			color = '\x1b[34m';
			break;

		case LogLevel.Info:
			color = '\x1b[32m';
			break;

		case LogLevel.Warning:
			color = '\x1b[33m';
			break;

		case LogLevel.Error:
			color = '\x1b[31m';
			break;
	}
	return color + (bold ? '\x1b[1m' : '');
}

/**
 * Log client that stores logs in memory buffers with rotation support.
 * 
 * Maintains an array of string buffers that rotate when the current buffer exceeds maxBufferSize.
 * Useful for in-memory log aggregation, testing, or when you need programmatic access to logs.
 * 
 * Supports:
 * - Log transformation via `setLogTransformer()`
 * - Callbacks when logs are appended via `setLogAppendedListener()`
 * - Color code preservation via `keepLogsNaturalColors()`
 */
export class LogClient_MemBuffer
	extends LogClient_BaseRotate {
	/** If true, preserves natural colors in log output (disables ANSI color codes) */
	private keepNaturalColors = false;
	/** Array of log buffers, where index 0 is the current buffer */
	readonly buffers: string[] = [''];
	/** Optional callback invoked when a log is appended */
	private onLogAppended?: VoidFunction;
	/** Optional function to transform log strings before storage */
	private logTransformer?: (log: string) => string;

	/**
	 * Creates a new memory buffer log client.
	 * 
	 * @param name - Identifier for this log client
	 * @param maxBuffers - Maximum number of rotated buffers to keep (default: 10)
	 * @param maxBufferSize - Maximum buffer size in bytes before rotation (default: 1MB)
	 */
	constructor(name: string, maxBuffers = 10, maxBufferSize = 1024 * 1024) {
		super(name, maxBuffers, maxBufferSize);
	}

	/**
	 * Sets a function to transform log strings before they are stored.
	 * 
	 * The transformer receives the log content (without prefix) and can modify it.
	 * Useful for sanitization, formatting, or filtering sensitive data.
	 * 
	 * @param logTransformer - Function that transforms log strings
	 */
	setLogTransformer(logTransformer: (log: string) => string) {
		this.logTransformer = logTransformer;
	}

	/**
	 * Sets a callback to be invoked whenever a log is appended to the buffer.
	 * 
	 * Useful for real-time log monitoring or triggering actions when logs are written.
	 * 
	 * @param onLogAppended - Function to call when a log is appended
	 */
	setLogAppendedListener(onLogAppended: VoidFunction) {
		this.onLogAppended = onLogAppended;
	}

	/**
	 * Processes log message with color codes and optional transformation.
	 * 
	 * Applies ANSI color codes, transforms the log if a transformer is set, and
	 * formats with proper indentation.
	 * 
	 * @param level - Log level
	 * @param bold - Whether to apply bold formatting
	 * @param prefix - Composed prefix string
	 * @param toLog - Array of values to log
	 * @returns Formatted log string
	 */
	protected processLogMessage(level: LogLevel, bold: boolean, prefix: string, toLog: LogParam[]) {
		const color = getColor(level, bold);
		let log = _logger_convertLogParamsToStrings(toLog).join(' ');
		const linePrefix = `${color}${prefix}${this.keepNaturalColors ? NoColor : ''}`;

		if (this.logTransformer)
			log = this.logTransformer(log);

		return _logger_indentNewLineBy(linePrefix, log);
	}

	/**
	 * Appends a log message to the current buffer and invokes the callback.
	 * 
	 * @param log - Formatted log string (includes newline)
	 */
	protected printLogMessage(log: string) {
		this.buffers[0] += log;
		this.onLogAppended?.();
	}

	/**
	 * No cleanup needed for memory buffers (they're just strings).
	 */
	protected cleanup(): void {
	}

	/**
	 * Rotates buffers by copying the source buffer to the destination index.
	 * 
	 * @param fromIndex - Source buffer index
	 * @param toIndex - Destination buffer index
	 */
	protected rotateBuffer(fromIndex: number, toIndex: number): void {
		this.buffers[toIndex] = this.buffers[fromIndex];
	}

	/**
	 * Prepares a new buffer by clearing the current one.
	 */
	protected prepare(): void {
		this.buffers[0] = '';
	}

	/**
	 * Controls whether natural colors in log output are preserved.
	 * 
	 * @param keepNaturalColors - If true, disables color codes. Defaults to true.
	 */
	public keepLogsNaturalColors(keepNaturalColors = true) {
		this.keepNaturalColors = keepNaturalColors;
	}
}
