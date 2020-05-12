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

import {
	LogClient,
	LogLevel,
	LogParam,
	_logger_convertLogParamsToStrings
} from "@nu-art/ts-common";

export type LogFilter = (level: LogLevel, tag: string) => boolean;

export class LogClient_BugReport
	extends LogClient {

	readonly name: string;

	private maxLogSize: number = 1024 * 1024;
	private maxEntries: number = 10;

	private filter: LogFilter = () => true;
	private index: number = 0;
	readonly buffers: string[] = [""];

	constructor(name: string) {
		super();
		this.name = name;
	}

	setMaxLogSize(maxLogSize: number) {
		this.maxLogSize = maxLogSize;
		return this;
	}

	setMaxEntries(maxEntries: number) {
		this.maxEntries = maxEntries;
		return this;
	}

	setFilter(filter: LogFilter) {
		this.filter = filter;
		return this;
	}

	public log(tag: string, level: LogLevel, bold: boolean, toLog: LogParam[]): void {
		if (!this.filter(level, tag))
			return;

		super.log(tag, level, bold, toLog);
	}

	protected logMessage(level: LogLevel, bold: boolean, prefix: string, toLog: LogParam[]): void {
		const toLogAsString = _logger_convertLogParamsToStrings(toLog);
		this.checkIndex();
		for (const paramAsString of toLogAsString) {
			this.buffers[this.index] += (paramAsString + "\n");
		}
	}

	checkIndex = () => {
		if (this.buffers.length < this.maxLogSize)
			return;

		this.index++;
		if (this.index >= this.maxEntries) {
			for (let i = 1; i < this.buffers.length; i++) {
				this.buffers[i - 1] = this.buffers[i];
			}
			this.index = this.buffers.length - 1;
		}

		this.buffers[this.index] = "";
	}
}

export const LogClient_DefaultBugReport = new LogClient_BugReport("default");