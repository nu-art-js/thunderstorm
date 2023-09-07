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

import {LogLevel, LogLevelOrdinal} from './logger/types';
import {MUSTNeverHappenException} from './exceptions/exceptions';
import {DebugFlags} from './DebugFlags';


export class DebugFlag {

	readonly key: string;

	public static createFlag(key: string) {
		const existingInstance = DebugFlags.flags[key];
		// @ts-ignore
		return existingInstance ?? new DebugFlag(key);
	}

	private constructor(key: string) {
		this.key = key;

		DebugFlags.add(this);
	}

	setMinLevel(logLevel: LogLevel) {
		DebugFlags.persistentState.set(this.key, {logLevel});
	}

	enable(enabled = true) {
		DebugFlags.persistentState.set(this.key, {enabled});
	}

	rename(newKey: string) {
		DebugFlags.rename(this.key, newKey);
	}

	canLog(level: LogLevel) {
		const config = DebugFlags.persistentState.get(this.key);
		if (!config)
			throw new MUSTNeverHappenException(`No debug flag config for key: ${this.key}`);

		if (!config.enabled)
			return false;

		return LogLevelOrdinal.indexOf(level) >= LogLevelOrdinal.indexOf(config.logLevel);
	}
}

export type DebugFlagConfig = { enabled: boolean, logLevel: LogLevel };

export interface DebugFlagPersistentStorage {
	get(debugKey: string): DebugFlagConfig;

	set(debugKey: string, state?: Partial<DebugFlagConfig>): void;
}

