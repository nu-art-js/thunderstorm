/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

/**
 * Log levels ordered from most verbose (lowest priority) to least verbose (highest priority).
 *
 * Used for filtering and controlling log output granularity.
 */
export enum LogLevel {
	Verbose = 'Verbose',
	Debug   = 'Debug',
	Info    = 'Info',
	Warning = 'Warning',
	Error   = 'Error',
}

/**
 * Array of log levels in ordinal order (least to most severe).
 *
 * Used for comparisons and determining if a log level meets a threshold.
 */
export const LogLevelOrdinal = [
	LogLevel.Verbose,
	LogLevel.Debug,
	LogLevel.Info,
	LogLevel.Warning,
	LogLevel.Error,
];

/**
 * Function type that composes the prefix string for log messages.
 *
 * The prefix typically includes timestamp, log level indicator, and tag.
 *
 * @param tag - Logger tag/identifier
 * @param level - Log level
 * @returns Formatted prefix string
 */
export type LogPrefixComposer = (tag: string, level: LogLevel) => string;

/**
 * Type for log message parameters - can be any value that can be logged.
 */
export type LogParam = string | boolean | number | object | any[] | Error | undefined | null | symbol | bigint;