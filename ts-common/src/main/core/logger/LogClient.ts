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
	LogParam,
	LogPrefixComposer
} from "./types";

export abstract class LogClient {

	private prefixComposer: LogPrefixComposer = DefaultLogPrefixComposer;

	protected abstract logMessage(level: LogLevel, bold: boolean, prefix: string, ...toLog: LogParam[]): void;

	public setComposer(logComposer: LogPrefixComposer) {
		this.prefixComposer = logComposer;
	}

	public log(tag: string, level: LogLevel, bold: boolean, toLog: LogParam[]): void {
		this.logMessage(level, bold, this.prefixComposer(tag, level), toLog);
	}
}

export const _logger_timezoneOffset: number = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
export const _logger_finalDate: Date = new Date();

export function _logger_getPrefix(level: LogLevel) {
	switch (level) {
		case LogLevel.Verbose:
			return '-V-';

		case LogLevel.Debug:
			return '-D-';

		case LogLevel.Info:
			return '-I-';

		case LogLevel.Warning:
			return '-W-';

		case LogLevel.Error:
			return '-E-';

		default:
			return '---';
	}
}

export const DefaultLogPrefixComposer: LogPrefixComposer = (tag: string, level: LogLevel): string => {
	_logger_finalDate.setTime(Date.now() - _logger_timezoneOffset);
	const date = _logger_finalDate.toISOString().replace(/T/, '_').replace(/Z/, '').substr(0, 23);
	return `  ${date} ${_logger_getPrefix(level)} ${tag}:  `;
};


