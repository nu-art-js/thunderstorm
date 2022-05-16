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

class LogClient_Browser_class
	extends LogClient {

	getColor(level: LogLevel, bold: boolean): string {
		let color;
		switch (level) {
			case LogLevel.Verbose:
				color = '#808080';
				break;

			case LogLevel.Debug:
				color = '#6564c9';
				break;

			case LogLevel.Info:
				color = '#189702';
				break;

			case LogLevel.Warning:
				color = '#926E00';
				break;

			case LogLevel.Error:
				color = '#B40000';
				break;
		}

		return color || '#000000';
	}

	protected logMessage(level: LogLevel, bold: boolean, prefix: string, toLog: LogParam[]): void {
		const color = this.getColor(level, bold);
		for (const param of toLog) {
			if (typeof param === "string") {
				console.log(`%c${prefix}${param}`, `color: ${color}`);
				continue
			}

			console.log(param);
		}
	}
}

export const LogClient_Browser = new LogClient_Browser_class();