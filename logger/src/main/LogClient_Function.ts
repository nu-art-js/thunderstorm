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
import {_logger_logException} from './utils.js';

/**
 * Log client that outputs to console with special handling for different value types.
 *
 * Uses a simplified prefix format and handles various JavaScript types appropriately:
 * - Errors: Extracts stack trace
 * - Objects: JSON stringification
 * - Primitives: Direct output
 * - Functions/Symbols/BigInt: Type name only
 */
class LogClient_Function_class
	extends LogClient {
	constructor() {
		super();
		this.setComposer((tag, level) => `${level} ${tag}: `);
	}

	/**
	 * Outputs log messages with type-specific formatting.
	 *
	 * Handles different value types appropriately:
	 * - Errors: Uses stack trace extraction
	 * - Objects: JSON stringification
	 * - Primitives: Direct string conversion
	 * - Functions/Symbols/BigInt: Outputs type name only
	 *
	 * @param level - Log level
	 * @param bold - Whether to apply bold formatting (not used in this implementation)
	 * @param prefix - Composed prefix string
	 * @param toLog - Array of values to log
	 */
	protected logMessage(level: LogLevel, bold: boolean, prefix: string, toLog: LogParam[]): void {
		for (const logParam of toLog) {
			if (logParam)
				// @ts-ignore
				if (logParam.stack) {
					console.log(`${prefix}${_logger_logException(logParam as Error)}`);
					continue;
				}

			switch (typeof logParam) {
				case 'undefined':
				case 'function':
				case 'symbol':
				case 'bigint':
					console.log(`${prefix}${typeof logParam}`);
					continue;

				case 'boolean':
				case 'number':
				case 'string':
					console.log(`${prefix}${logParam}`);
					continue;

				case 'object':
					console.log(`${prefix}${JSON.stringify(logParam)}`);
					continue;
			}
		}
	}
}

export const LogClient_Function = new LogClient_Function_class();