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
} from "./types";
import {LogClient} from "./LogClient";
import {
	_logger_convertLogParamsToStrings,
	_logger_indentNewLineBy
} from "./utils";

export const NoColor = '\x1b[0m';

class LogClient_Terminal_class
	extends LogClient {

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

	protected logMessage(level: LogLevel, bold: boolean, prefix: string, toLog: LogParam[]): void {
		const color = this.getColor(level, bold);
		const paramsAsStrings = _logger_convertLogParamsToStrings(toLog);

		console.log(_logger_indentNewLineBy(color + prefix, paramsAsStrings.join(" ") + NoColor))
	}
}


export const LogClient_Terminal = new LogClient_Terminal_class();