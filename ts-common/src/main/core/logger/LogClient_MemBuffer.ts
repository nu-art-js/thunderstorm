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

import {LogClient_BaseRotate} from './LogClient_BaseRotate';
import {LogLevel, LogParam} from './types';
import {_logger_convertLogParamsToStrings, _logger_indentNewLineBy} from './utils';
import {NoColor} from './LogClient_Terminal';


function getColor(level: LogLevel, bold = false): string {
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

export class LogClient_MemBuffer
	extends LogClient_BaseRotate {
	private keepNaturalColors = false;
	readonly buffers: string[] = [''];
	private onLogAppended?: VoidFunction;

	constructor(name: string, maxBuffers = 10, maxBufferSize = 1024 * 1024) {
		super(name, maxBuffers, maxBufferSize);
	}

	setLogAppendedListener(onLogAppended: VoidFunction) {
		this.onLogAppended = onLogAppended;
	}

	protected processLogMessage(level: LogLevel, bold: boolean, prefix: string, toLog: LogParam[]) {
		const color = getColor(level, bold);
		const paramsAsStrings = _logger_convertLogParamsToStrings(toLog);
		const linePrefix = `${color}${prefix}${this.keepNaturalColors ? NoColor : ''}`;
		return _logger_indentNewLineBy(linePrefix, paramsAsStrings.join(' '));
	}

	protected printLogMessage(log: string) {
		this.buffers[0] += log;
		this.onLogAppended?.();
	}

	protected cleanup(): void {
	}

	protected rotateBuffer(fromIndex: number, toIndex: number): void {
		this.buffers[toIndex] = this.buffers[fromIndex];
	}

	protected prepare(): void {
		this.buffers[0] = '';
	}

	public keepLogsNaturalColors(keepNaturalColors = true) {
		this.keepNaturalColors = keepNaturalColors;
	}
}
