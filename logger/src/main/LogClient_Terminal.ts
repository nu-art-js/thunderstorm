/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {
	LogLevel,
	LogParam
} from './types.js';
import {LogClient} from './LogClient.js';
import {
	_logger_convertLogParamsToStrings,
	_logger_indentNewLineBy
} from './utils.js';


/**
 * ANSI escape code to reset terminal color formatting.
 *
 * Used to reset color codes after applying colored log output.
 */
export const NoColor = '\x1b[0m';

/**
 * Log client implementation for terminal/console output with ANSI color codes.
 *
 * Outputs colored log messages to the console using ANSI escape sequences.
 * Different log levels are displayed in different colors for visual distinction.
 */
class LogClient_Terminal_class
	extends LogClient {

	/** If true, preserves natural colors in log output (disables color codes) */
	private keepNaturalColors = false;

	/**
	 * Gets the ANSI color code for a log level.
	 *
	 * @param level - Log level
	 * @param bold - Whether to apply bold formatting
	 * @returns ANSI escape sequence for the color
	 */
	getColor(level: LogLevel, bold = false): string {
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
	 * Outputs a log message to the terminal with color formatting.
	 *
	 * Converts all log parameters to strings, applies color codes, and outputs
	 * to console.log. Always resets color at the end of the line.
	 *
	 * @param level - Log level
	 * @param bold - Whether to apply bold formatting
	 * @param prefix - Composed prefix string
	 * @param toLog - Array of values to log
	 */
	protected logMessage(level: LogLevel, bold: boolean, prefix: string, toLog: LogParam[]): void {
		const color = this.getColor(level, bold);
		const paramsAsStrings = _logger_convertLogParamsToStrings(toLog);

		const linePrefix = `${color}${prefix}${this.keepNaturalColors ? NoColor : ''}`;
		console.log(_logger_indentNewLineBy(linePrefix, paramsAsStrings.join(' ')) + NoColor);
	}

	/**
	 * Controls whether natural colors in log output are preserved.
	 *
	 * When enabled, disables ANSI color codes to preserve any colors that might
	 * be present in the log content itself.
	 *
	 * @param keepNaturalColors - If true, disables color codes. Defaults to true.
	 */
	public keepLogsNaturalColors(keepNaturalColors = true) {
		this.keepNaturalColors = keepNaturalColors;
	}
}

export const LogClient_Terminal = new LogClient_Terminal_class();