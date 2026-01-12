/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {_logger_finalDate, _logger_getPrefix, _logger_timezoneOffset, LogClient} from './LogClient.js';
import {LogLevel, LogParam} from './types.js';

/** Array of primitive types that can be combined with prefix */
const PrimitiveLogParams: LogParam[] = ['string', 'number', 'boolean'];

/**
 * CSS style object for browser console styling.
 *
 * Defines CSS properties that can be applied to log messages using browser
 * console's `%c` formatting. Used by LogClient_BrowserGroups for styled output.
 */
export type LoggerStyleObject = {
	color?: string;
	'background-color'?: string;
	'font-weight'?: 'bold' | 'normal';
	padding?: string;
	'border-radius'?: string;
}

/**
 * Log client for browser console with grouped output and styled prefixes.
 *
 * Uses browser console's grouping feature (console.groupCollapsed) to organize
 * logs. Applies CSS styling to different parts of the log prefix (level, timestamp, tag)
 * for visual distinction. If the first log parameter is a primitive, it's combined
 * with the prefix for cleaner output.
 */
class LogClient_BrowserGroups_Class
	extends LogClient {

	constructor() {
		super();
		this.setComposer(this.newComposer);
	}

	// ################## Class Methods - Logging ##################

	private newComposer(tag: string, level: LogLevel) {
		_logger_finalDate.setTime(Date.now() - _logger_timezoneOffset);
		const date = _logger_finalDate.toISOString().replace(/T/, '_').replace(/Z/, '').substring(0, 23);
		return `%c${_logger_getPrefix(level)}%c${date}%c${tag}`;
	}

	/**
	 * Outputs log messages with browser console grouping and styling.
	 *
	 * If the first parameter is a primitive (string/number/boolean), it's combined
	 * with the prefix for cleaner single-line output. Otherwise, uses console.groupCollapsed
	 * to create a collapsible group with the prefix as the header and remaining parameters
	 * as grouped content.
	 *
	 * @param level - Log level
	 * @param bold - Whether to apply bold formatting
	 * @param prefix - Composed prefix string (with %c markers for styling)
	 * @param toLog - Array of values to log
	 */
	protected logMessage(level: LogLevel, bold: boolean, prefix: string, toLog: LogParam[]): void {
		if (!prefix.startsWith('%c'))
			prefix = `%c ${prefix}`;

		//If the first log param is a primitive combine it with the prefix
		if (PrimitiveLogParams.includes(typeof toLog[0])) {
			prefix += ` ${toLog[0]}`;
			toLog.shift();
		}

		//If no more items to log
		if (!toLog.length)
			return this.logSingle(level, bold, prefix);

		this.logGroup(level, bold, prefix, toLog);
	}

	private logSingle = (logLevel: LogLevel, bold: boolean, toLog: string) => {
		console.log(
			toLog,
			this.getLogLevelStyling(logLevel, bold),
			this.getTimestampStyling(bold, logLevel),
			this.getTagStyling(logLevel, bold)
		);
	};

	private logGroup = (logLevel: LogLevel, bold: boolean, prefix: string, toLog: LogParam[]) => {
		// group & groupCollapsed print the same thing, only groupCollapsed is collapsed by default.
		// console.group(
		console.groupCollapsed(
			prefix,
			this.getLogLevelStyling(logLevel, bold),
			this.getTimestampStyling(bold, logLevel),
			this.getTagStyling(logLevel, bold)
		);
		toLog.forEach(logParam => console.log(logParam));
		console.groupEnd();
	};

	// ################## Class Methods - Styling ##################

	private getLogLevelColor = (logLevel: LogLevel): string => {
		switch (logLevel) {
			case LogLevel.Verbose:
				return '#444444';
			case LogLevel.Debug:
				return '#3066be';
			case LogLevel.Info:
				return '#52a447';
			case LogLevel.Warning:
				return '#ed820e';
			case LogLevel.Error:
				return '#d14348';
			default:
				return 'transparent';
		}
	};

	private composeStyleString = (styleObject: LoggerStyleObject): string => {
		const styleArr = (Object.keys(styleObject) as (keyof LoggerStyleObject)[]).map((key) => `${key}: ${styleObject[key]}`);
		return styleArr.join(';') + ';';
	};

	private getLogLevelStyling = (logLevel: LogLevel, bold: boolean): string => {
		return this.composeStyleString({
			color: '#ffffff',
			'background-color': this.getLogLevelColor(logLevel),
			'font-weight': bold ? 'bold' : 'normal',
			padding: '2px 5px',
			'border-radius': '4px 0 0 4px',
		});
	};

	private getTimestampStyling = (bold: boolean, logLevel: LogLevel): string => {
		return this.composeStyleString({
			color: '#ffffff',
			'background-color': this.getLogLevelColor(logLevel),
			'font-weight': bold ? 'bold' : 'normal',
			padding: '2px 5px',
			'border-radius': '0 4px 4px 0',
		});
	};

	private getTagStyling = (logLevel: LogLevel, bold: boolean): string => {
		return this.composeStyleString({
			color: this.getLogLevelColor(logLevel),
			'font-weight': bold ? 'bold' : 'normal',
			padding: '2px 5px',
		});
	};
}

export const LogClient_BrowserGroups = new LogClient_BrowserGroups_Class();