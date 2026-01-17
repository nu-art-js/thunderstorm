/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {LogLevel, LogParam} from './types.js';
import {LogClient} from './LogClient.js';
import {getLogStyle, LogStyle} from './get-log-style.js';


/**
 * Log client implementation for browser console output with CSS styling.
 * 
 * Uses browser console's `%c` formatting to apply CSS styles to log messages.
 * Different log levels are styled with different colors for visual distinction.
 */
class LogClient_Browser_class
	extends LogClient {

	/** CSS styles for different log levels */
	private style: Record<string, LogStyle> = {
		base: {
			// 'background-color': '#fff',
			'padding': '2px 0px',
			'border-radius': '2px',
		},
		verbose: {
			'color': '#808080',
			'background-color': 'unset'
		},
		debug: {
			'color': '#6564c9',
		},
		info: {
			'color': '#189702',
		},
		warning: {
			'color': '#926E00',
		},
		error: {
			'color': '#B40000',
		}
	};

	/**
	 * Gets the CSS style string for a log level.
	 * 
	 * Returns a CSS style string compatible with browser console's `%c` formatting
	 * for the given log level. Combines base styles with level-specific colors.
	 * 
	 * @param level - Log level
	 * @param bold - Whether to apply bold formatting (not currently used)
	 * @returns CSS style string for console.log formatting
	 */
	getColor(level: LogLevel, bold: boolean): string {
		switch (level) {
			case LogLevel.Verbose:
				return getLogStyle(this.style.base, this.style.verbose);
			case LogLevel.Debug:
				return getLogStyle(this.style.base, this.style.debug);
			case LogLevel.Info:
				return getLogStyle(this.style.base, this.style.info);
			case LogLevel.Warning:
				return getLogStyle(this.style.base, this.style.warning);
			case LogLevel.Error:
				return getLogStyle(this.style.base, this.style.error);
			default:
				return getLogStyle({'color': '#000000'});
		}
	}

	/**
	 * Outputs a log message to the browser console with CSS styling.
	 * 
	 * Uses `%c` formatting to apply styles. Strings are concatenated with the prefix,
	 * while objects are passed as separate arguments to preserve browser console's
	 * object inspection capabilities.
	 * 
	 * @param level - Log level
	 * @param bold - Whether to apply bold formatting (not currently used in browser)
	 * @param prefix - Composed prefix string
	 * @param toLog - Array of values to log
	 */
	protected logMessage(level: LogLevel, bold: boolean, prefix: string, toLog: LogParam[]): void {
		for (const param of toLog) {
			if (typeof param === 'string') {
				console.log(`%c${prefix}${param}`, this.getColor(level, bold));
				continue;
			}
			if (typeof param === 'object') {
				console.log(`%c${prefix}`, this.getColor(level, bold), param);
				continue;
			}
			console.log(`%c${prefix}`, this.getColor(level, bold), param);
		}
	}
}

export const LogClient_Browser = new LogClient_Browser_class();