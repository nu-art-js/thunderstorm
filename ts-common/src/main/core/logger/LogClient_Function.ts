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

import {
	LogLevel,
	LogParam
} from "./types.js";
import {LogClient} from "./LogClient.js";
import {_logger_logException} from "./utils.js";

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
		this.setComposer((tag, level) => `${level} ${tag}: `)
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
				case "undefined":
				case "function":
				case "symbol":
				case "bigint":
					console.log(`${prefix}${typeof logParam}`);
					continue;

				case "boolean":
				case "number":
				case "string":
					console.log(`${prefix}${logParam}`);
					continue;

				case "object":
					console.log(`${prefix}${JSON.stringify(logParam)}`);
					continue;
			}
		}
	}
}

export const LogClient_Function = new LogClient_Function_class();