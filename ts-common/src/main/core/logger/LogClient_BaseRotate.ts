/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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

import {LogClient} from './LogClient.js';
import {LogLevel, LogParam} from './types.js';
import {_logger_convertLogParamsToStrings, _logger_indentNewLineBy} from './utils.js';


/** Callback function type for log rotation events */
type LogRotateListener = () => void

/**
 * Base class for log clients that support log rotation.
 * 
 * Automatically rotates logs when the buffer size exceeds `maxSize`. Rotation works
 * by shifting existing log files/buffers (e.g., log-0.txt → log-1.txt, log-1.txt → log-2.txt)
 * and creating a new current log file/buffer. Oldest logs beyond `maxEntries` are deleted.
 * 
 * Subclasses must implement:
 * - `printLogMessage()` - How to output the log
 * - `prepare()` - Initialize the buffer/file
 * - `cleanup()` - Clean up old logs
 * - `rotateBuffer()` - Move log from one index to another
 */
export abstract class LogClient_BaseRotate
	extends LogClient {

	/** Name identifier for this log client (used in filenames) */
	readonly name: string;
	/** Maximum number of rotated log files/buffers to keep */
	readonly maxEntries: number;
	/** Maximum size in bytes before rotation is triggered */
	readonly maxSize: number;

	/** Current size of the buffer in bytes */
	protected bufferSize = 0;

	/** Optional callback invoked when rotation occurs */
	private rotationListener?: LogRotateListener;

	/**
	 * Creates a new rotating log client.
	 * 
	 * @param name - Identifier for this log client (used in filenames)
	 * @param maxEntries - Maximum number of rotated logs to keep (default: 10)
	 * @param maxSize - Maximum buffer size in bytes before rotation (default: 1MB)
	 */
	protected constructor(name: string, maxEntries = 10, maxSize = 1024 * 1024) {
		super();
		this.name = name;
		this.maxSize = maxSize;
		this.maxEntries = maxEntries;
	}

	/**
	 * Processes and outputs a log message, checking for rotation.
	 * 
	 * Checks if rotation is needed before writing. Tracks buffer size and triggers
	 * rotation when the threshold is exceeded.
	 * 
	 * @param level - Log level
	 * @param bold - Whether to apply bold formatting
	 * @param prefix - Composed prefix string
	 * @param toLog - Array of values to log
	 */
	protected logMessage(level: LogLevel, bold: boolean, prefix: string, toLog: LogParam[]): void {
		const log = this.processLogMessage(level, bold, prefix, toLog);

		this.rotate();

		const finalLog = log + '\n';
		this.printLogMessage(finalLog);
		this.bufferSize += finalLog.length;
	}

	/**
	 * Processes log parameters into a formatted string.
	 * 
	 * Can be overridden by subclasses to customize formatting.
	 * 
	 * @param level - Log level
	 * @param bold - Whether to apply bold formatting
	 * @param prefix - Composed prefix string
	 * @param toLog - Array of values to log
	 * @returns Formatted log string
	 */
	protected processLogMessage(level: LogLevel, bold: boolean, prefix: string, toLog: LogParam[]) {
		const paramsAsStrings = _logger_convertLogParamsToStrings(toLog);
		return _logger_indentNewLineBy(prefix, paramsAsStrings.join(' '));
	}

	/**
	 * Sets a callback to be invoked when log rotation occurs.
	 * 
	 * @param rotationListener - Function to call on rotation
	 * @returns This instance for method chaining
	 */
	setRotationListener(rotationListener: LogRotateListener) {
		this.rotationListener = rotationListener;
		return this;
	}

	/**
	 * Outputs the formatted log message.
	 * 
	 * Must be implemented by subclasses to define the actual output mechanism.
	 * 
	 * @param log - Formatted log string (includes newline)
	 */
	protected abstract printLogMessage(log: string): void

	/**
	 * Checks if rotation is needed and performs it if the buffer size exceeds maxSize.
	 * 
	 * Rotation process:
	 * 1. Deletes the oldest log (cleanup)
	 * 2. Shifts all logs one position (rotateBuffer)
	 * 3. Creates a new current log (prepare)
	 * 4. Resets buffer size counter
	 * 5. Invokes rotation listener if set
	 */
	private rotate(): void {
		if (this.bufferSize < this.maxSize)
			return;

		this.cleanup();

		for (let i = this.maxEntries - 1; i > 0; i--) {
			this.rotateBuffer(i - 1, i);
		}

		this.rotationListener?.();
		this.bufferSize = 0;
		this.prepare();
	}

	protected abstract cleanup(): void;

	protected abstract prepare(): void;

	protected abstract rotateBuffer(fromIndex: number, toIndex: number): void;

}
