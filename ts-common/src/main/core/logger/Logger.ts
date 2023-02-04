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

import {DebugFlag, DebugFlags} from '../debug-flags';
import {LogLevel, LogParam} from './types';
import {BeLogged} from './BeLogged';


export class Logger {

	private tag: string;
	public static defaultFlagState = true;
	protected readonly _DEBUG_FLAG: DebugFlag;

	public constructor(tag?: string) {
		this.tag = tag ?? this.constructor['name'];

		this._DEBUG_FLAG = DebugFlags.createFlag(this.tag);
		this._DEBUG_FLAG.enable(Logger.defaultFlagState);
	}

	setMinLevel(minLevel: LogLevel) {
		this._DEBUG_FLAG.setMinLevel(minLevel);
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

		return this._DEBUG_FLAG.canLog(level);
	}
}

export abstract class StaticLogger {

	protected static readonly _DEBUG_FLAG = DebugFlags.createFlag('StaticLogger');
	static {
		StaticLogger._DEBUG_FLAG.enable(Logger.defaultFlagState);
	}

	static setMinLevel(minLevel: LogLevel) {
		this._DEBUG_FLAG.setMinLevel(minLevel);
	}

	public static logVerbose(tag: string, ...toLog: LogParam[]): void {
		this.log(tag, LogLevel.Verbose, false, toLog);
	}

	public static logDebug(tag: string, ...toLog: LogParam[]): void {
		this.log(tag, LogLevel.Debug, false, toLog);
	}

	public static logInfo(tag: string, ...toLog: LogParam[]): void {
		this.log(tag, LogLevel.Info, false, toLog);
	}

	public static logWarning(tag: string, ...toLog: LogParam[]): void {
		this.log(tag, LogLevel.Warning, false, toLog);
	}

	public static logError(tag: string, ...toLog: LogParam[]): void {
		this.log(tag, LogLevel.Error, false, toLog);
	}

	public static logVerboseBold(tag: string, ...toLog: LogParam[]): void {
		this.log(tag, LogLevel.Verbose, true, toLog);
	}

	public static logDebugBold(tag: string, ...toLog: LogParam[]): void {
		this.log(tag, LogLevel.Debug, true, toLog);
	}

	public static logInfoBold(tag: string, ...toLog: LogParam[]): void {
		this.log(tag, LogLevel.Info, true, toLog);
	}

	public static logWarningBold(tag: string, ...toLog: LogParam[]): void {
		this.log(tag, LogLevel.Warning, true, toLog);
	}

	public static logErrorBold(tag: string, ...toLog: LogParam[]): void {
		this.log(tag, LogLevel.Error, true, toLog);
	}

	public static log(tag: string, level: LogLevel, bold: boolean, toLog: LogParam[]): void {
		if (!this.assertCanPrint(level))
			return;

		// @ts-ignore
		BeLogged.logImpl(tag, level, bold, toLog);
	}

	private static assertCanPrint(level: LogLevel) {
		if (!this._DEBUG_FLAG.isEnabled())
			return;

		return this._DEBUG_FLAG.canLog(level);
	}
}

