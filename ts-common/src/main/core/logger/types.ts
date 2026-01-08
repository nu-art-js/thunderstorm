/*
 * ts-common is the basic building blocks of our typescript projects
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
export type LogParam = string | boolean | number | object | any[] | Error | undefined | null