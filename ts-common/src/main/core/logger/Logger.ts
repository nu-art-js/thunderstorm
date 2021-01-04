/*
 * ts-common is the basic building blocks of our typescript projects
 *
 * Copyright (C) 2020 Intuition Robotics
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
	DebugFlag,
	DebugFlags
} from "../debug-flags";
import {
	LogLevel,
	LogParam,
	LogLevelOrdinal
} from "./types";
import {BeLogged} from "./BeLogged";

export class Logger {

	public static readonly log = new Logger("LOGGER");

	private tag: string;
	public static defaultFlagState = true;
	protected readonly _DEBUG_FLAG: DebugFlag;
	protected minLevel = LogLevel.Verbose;

	public constructor(tag?: string) {
		this.tag = tag ?? this.constructor["name"];

		this._DEBUG_FLAG = DebugFlags.createFlag(this.tag);
		this._DEBUG_FLAG.enable(Logger.defaultFlagState);
	}

	setMinLevel(minLevel: LogLevel) {
		this.minLevel = minLevel;
	}

	protected setTag(tag: string): void {
		this.tag = tag;
		this._DEBUG_FLAG.rename(tag);
	}

	public logVerbose(...toLog: LogParam[]): void {
		this.log(LogLevel.Verbose, false, toLog);
	}

	public logDebug(...toLog: LogParam[]): void {
		this.log(LogLevel.Debug, false, toLog);
	}

	public logInfo(...toLog: LogParam[]): void {
		this.log(LogLevel.Info, false, toLog);
	}

	public logWarning(...toLog: LogParam[]): void {
		this.log(LogLevel.Warning, false, toLog);
	}

	public logError(...toLog: LogParam[]): void {
		this.log(LogLevel.Error, false, toLog);
	}

	public logVerboseBold(...toLog: LogParam[]): void {
		this.log(LogLevel.Verbose, true, toLog);
	}

	public logDebugBold(...toLog: LogParam[]): void {
		this.log(LogLevel.Debug, true, toLog);
	}

	public logInfoBold(...toLog: LogParam[]): void {
		this.log(LogLevel.Info, true, toLog);
	}

	public logWarningBold(...toLog: LogParam[]): void {
		this.log(LogLevel.Warning, true, toLog);
	}

	public logErrorBold(...toLog: LogParam[]): void {
		this.log(LogLevel.Error, true, toLog);
	}

	public log(level: LogLevel, bold: boolean, toLog: LogParam[]): void {
		if (!this.assertCanPrint(level))
			return;

		// @ts-ignore
		BeLogged.logImpl(this.tag, level, bold, toLog);
	}

	private assertCanPrint(level: LogLevel) {
		if (!this._DEBUG_FLAG.isEnabled())
			return;

		return LogLevelOrdinal.indexOf(level) >= LogLevelOrdinal.indexOf(this.minLevel)
	}
}