/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {LogLevel, LogParam} from './types.js';
import {BeLogged} from './BeLogged.js';
import {DebugFlag, DebugFlags} from './debug-flags.js';


/**
 * Base logging class that provides structured logging with debug flag integration.
 *
 * Logger instances are associated with a DebugFlag that controls:
 * - Whether logging is enabled for this logger
 * - The minimum log level that will be output
 *
 * Logging is filtered at two levels:
 * 1. Debug flag must be enabled (`_DEBUG_FLAG.isEnabled()`)
 * 2. Log level must meet the minimum threshold (`_DEBUG_FLAG.canLog(level)`)
 *
 * If either check fails, the log message is silently dropped.
 *
 * @example
 * ```typescript
 * class MyService extends Logger {
 *   constructor() {
 *     super('MyService');
 *   }
 *
 *   doSomething() {
 *     this.logInfo('Doing something');
 *     this.logDebug('Debug details');
 *   }
 * }
 * ```
 */
export class Logger {

	/** Logging tag/identifier for this logger */
	readonly tag: string;
	/** Default enabled state for new debug flags */
	public static defaultFlagState = true;
	/** Debug flag that controls logging for this instance */
	protected readonly _DEBUG_FLAG: DebugFlag;

	/**
	 * Creates a new Logger instance.
	 *
	 * Automatically creates a DebugFlag with the tag name. The flag is enabled
	 * by default (controlled by `Logger.defaultFlagState`).
	 *
	 * @param tag - Optional tag name. If not provided, uses the class name
	 */
	public constructor(tag?: string) {
		this.tag = tag ?? this.constructor['name'];

		this._DEBUG_FLAG = DebugFlags.createFlag(this.tag);
		this._DEBUG_FLAG.enable(Logger.defaultFlagState);
	}

	/**
	 * Sets the minimum log level for this logger.
	 *
	 * Only log messages at or above this level will be output. Lower-level
	 * messages are silently dropped.
	 *
	 * @param minLevel - Minimum log level (Verbose < Debug < Info < Warning < Error)
	 */
	setMinLevel(minLevel: LogLevel) {
		this._DEBUG_FLAG.setMinLevel(minLevel);
	}

	/**
	 * Changes the logging tag and updates the associated debug flag.
	 *
	 * @param tag - New tag name
	 */
	protected setTag(tag: string): void {
		// @ts-ignore
		this['tag'] = tag;
		this._DEBUG_FLAG.rename(tag);
	}

	/**
	 * Logs a verbose-level message (lowest priority, most detailed).
	 */
	public logVerbose(...toLog: LogParam[]): void {
		this.log(LogLevel.Verbose, false, toLog);
	}

	/**
	 * Logs a debug-level message (development/debugging information).
	 */
	public logDebug(...toLog: LogParam[]): void {
		this.log(LogLevel.Debug, false, toLog);
	}

	/**
	 * Logs an info-level message (general informational messages).
	 */
	public logInfo(...toLog: LogParam[]): void {
		this.log(LogLevel.Info, false, toLog);
	}

	/**
	 * Logs a warning-level message (potential issues that don't stop execution).
	 */
	public logWarning(...toLog: LogParam[]): void {
		this.log(LogLevel.Warning, false, toLog);
	}

	/**
	 * Logs an error-level message (errors that may affect functionality).
	 */
	public logError(...toLog: LogParam[]): void {
		this.log(LogLevel.Error, false, toLog);
	}

	/**
	 * Logs a verbose-level message with bold formatting.
	 */
	public logVerboseBold(...toLog: LogParam[]): void {
		this.log(LogLevel.Verbose, true, toLog);
	}

	/**
	 * Logs a debug-level message with bold formatting.
	 */
	public logDebugBold(...toLog: LogParam[]): void {
		this.log(LogLevel.Debug, true, toLog);
	}

	/**
	 * Logs an info-level message with bold formatting.
	 */
	public logInfoBold(...toLog: LogParam[]): void {
		this.log(LogLevel.Info, true, toLog);
	}

	/**
	 * Logs a warning-level message with bold formatting.
	 */
	public logWarningBold(...toLog: LogParam[]): void {
		this.log(LogLevel.Warning, true, toLog);
	}

	/**
	 * Logs an error-level message with bold formatting.
	 */
	public logErrorBold(...toLog: LogParam[]): void {
		this.log(LogLevel.Error, true, toLog);
	}

	/**
	 * Core logging method that performs the actual log output.
	 *
	 * Checks if logging is enabled and the level meets the threshold before
	 * delegating to the BeLogged system. If either check fails, the message
	 * is silently dropped.
	 *
	 * @param level - Log level (Verbose, Debug, Info, Warning, Error)
	 * @param bold - Whether to apply bold formatting
	 * @param toLog - Array of values to log (can be strings, objects, etc.)
	 */
	public log(level: LogLevel, bold: boolean, toLog: LogParam[]): void {
		if (!this.assertCanPrint(level))
			return;

		// @ts-ignore
		BeLogged.logImpl(this.tag, level, bold, toLog);
	}

	/**
	 * Checks if a log message at the given level should be printed.
	 *
	 * Returns false if:
	 * - The debug flag is not enabled, OR
	 * - The log level is below the minimum threshold
	 *
	 * @param level - Log level to check
	 * @returns true if the message should be logged, false otherwise
	 */
	private assertCanPrint(level: LogLevel): boolean {
		if (!this._DEBUG_FLAG.isEnabled())
			return false;

		return this._DEBUG_FLAG.canLog(level);
	}
}

/**
 * Static logging utility class for use cases where instance-based logging isn't needed.
 *
 * Provides the same logging interface as Logger but with static methods that require
 * a tag parameter for each log call. Useful for utility functions or standalone code
 * that doesn't have a class instance.
 *
 * All static loggers share a single debug flag named 'StaticLogger'.
 *
 * @example
 * ```typescript
 * function utilityFunction() {
 *   StaticLogger.logInfo('UtilityFunction', 'Processing data');
 *   StaticLogger.logError('UtilityFunction', 'Error occurred', error);
 * }
 * ```
 */
export abstract class StaticLogger {

	/** Shared debug flag for all static logging */
	protected static readonly _DEBUG_FLAG = DebugFlags.createFlag('StaticLogger');
	static {
		StaticLogger._DEBUG_FLAG.enable(Logger.defaultFlagState);
	}

	/**
	 * Sets the minimum log level for static logging.
	 *
	 * @param minLevel - Minimum log level
	 */
	static setMinLevel(minLevel: LogLevel) {
		this._DEBUG_FLAG.setMinLevel(minLevel);
	}

	/**
	 * Logs a verbose-level message with the given tag.
	 *
	 * @param tag - Tag identifier for this log message
	 * @param toLog - Values to log
	 */
	public static logVerbose(tag: string, ...toLog: LogParam[]): void {
		this.log(tag, LogLevel.Verbose, false, toLog);
	}

	/**
	 * Logs a debug-level message with the given tag.
	 *
	 * @param tag - Tag identifier for this log message
	 * @param toLog - Values to log
	 */
	public static logDebug(tag: string, ...toLog: LogParam[]): void {
		this.log(tag, LogLevel.Debug, false, toLog);
	}

	/**
	 * Logs an info-level message with the given tag.
	 *
	 * @param tag - Tag identifier for this log message
	 * @param toLog - Values to log
	 */
	public static logInfo(tag: string, ...toLog: LogParam[]): void {
		this.log(tag, LogLevel.Info, false, toLog);
	}

	/**
	 * Logs a warning-level message with the given tag.
	 *
	 * @param tag - Tag identifier for this log message
	 * @param toLog - Values to log
	 */
	public static logWarning(tag: string, ...toLog: LogParam[]): void {
		this.log(tag, LogLevel.Warning, false, toLog);
	}

	/**
	 * Logs an error-level message with the given tag.
	 *
	 * @param tag - Tag identifier for this log message
	 * @param toLog - Values to log
	 */
	public static logError(tag: string, ...toLog: LogParam[]): void {
		this.log(tag, LogLevel.Error, false, toLog);
	}

	/**
	 * Logs a verbose-level message with bold formatting.
	 *
	 * @param tag - Tag identifier for this log message
	 * @param toLog - Values to log
	 */
	public static logVerboseBold(tag: string, ...toLog: LogParam[]): void {
		this.log(tag, LogLevel.Verbose, true, toLog);
	}

	/**
	 * Logs a debug-level message with bold formatting.
	 *
	 * @param tag - Tag identifier for this log message
	 * @param toLog - Values to log
	 */
	public static logDebugBold(tag: string, ...toLog: LogParam[]): void {
		this.log(tag, LogLevel.Debug, true, toLog);
	}

	/**
	 * Logs an info-level message with bold formatting.
	 *
	 * @param tag - Tag identifier for this log message
	 * @param toLog - Values to log
	 */
	public static logInfoBold(tag: string, ...toLog: LogParam[]): void {
		this.log(tag, LogLevel.Info, true, toLog);
	}

	/**
	 * Logs a warning-level message with bold formatting.
	 *
	 * @param tag - Tag identifier for this log message
	 * @param toLog - Values to log
	 */
	public static logWarningBold(tag: string, ...toLog: LogParam[]): void {
		this.log(tag, LogLevel.Warning, true, toLog);
	}

	/**
	 * Logs an error-level message with bold formatting.
	 *
	 * @param tag - Tag identifier for this log message
	 * @param toLog - Values to log
	 */
	public static logErrorBold(tag: string, ...toLog: LogParam[]): void {
		this.log(tag, LogLevel.Error, true, toLog);
	}

	/**
	 * Core static logging method.
	 *
	 * @param tag - Tag identifier for this log message
	 * @param level - Log level
	 * @param bold - Whether to apply bold formatting
	 * @param toLog - Array of values to log
	 */
	public static log(tag: string, level: LogLevel, bold: boolean, toLog: LogParam[]): void {
		if (!this.assertCanPrint(level))
			return;

		// @ts-ignore
		BeLogged.logImpl(tag, level, bold, toLog);
	}

	/**
	 * Checks if a log message at the given level should be printed.
	 *
	 * @param level - Log level to check
	 * @returns true if the message should be logged, false otherwise
	 */
	private static assertCanPrint(level: LogLevel): boolean {
		if (!this._DEBUG_FLAG.isEnabled())
			return false;

		return this._DEBUG_FLAG.canLog(level);
	}
}

