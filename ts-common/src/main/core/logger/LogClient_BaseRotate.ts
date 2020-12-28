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

import {LogClient} from "./LogClient";
import {
	LogLevel,
	LogParam
} from "./types";
import {_logger_convertLogParamsToStrings} from "./utils";

type LogRotateListener = () => void

export abstract class LogClient_BaseRotate
	extends LogClient {

	readonly name: string;
	readonly maxEntries: number;
	readonly maxSize: number;

	protected bufferSize: number = 0;

	private rotationListener?: LogRotateListener;

	protected constructor(name: string, maxEntries = 10, maxSize = 1024 * 1024) {
		super();
		this.name = name;
		this.maxSize = maxSize;
		this.maxEntries = maxEntries;
	}

	protected logMessage(level: LogLevel, bold: boolean, prefix: string, toLog: LogParam[]): void {
		const toLogAsString = _logger_convertLogParamsToStrings(toLog);
		this.rotate();
		for (const paramAsString of toLogAsString) {
			const log = paramAsString + "\n";
			this.printLogMessage(log);
			this.bufferSize += log.length;
		}
	}

	setRotationListener(rotationListener: LogRotateListener) {
		this.rotationListener = rotationListener;
		return this;
	}

	protected abstract printLogMessage(log: string): void

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
