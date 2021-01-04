/*
 * Testelot is a typescript scenario composing framework
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
	Action,
	Status
} from "./Action";

import {
	BeLogged,
	LogClient,
	Logger,
	LogLevel,
	NoColor,
	_logger_convertLogParamsToStrings,
	_logger_indentNewLineBy,
	DefaultLogPrefixComposer,
	LogClient_Terminal,
	LogParam

} from "@ir/ts-common";

class ReportSummary {
	Running: number = 0;
	Skipped: number = 0;
	Success: number = 0;
	Error: number = 0;
}

export class Reporter
	extends Logger {

	private readonly reports: { [key: string]: ActionReport } = {};
	public readonly summary: ReportSummary = new ReportSummary();

	private report!: ActionReport;

	private reporter = new ReporterLogClient(this);

	constructor() {
		super("Testelot");
		BeLogged.addClient(this.reporter);
	}

	init() {
	}

	logMessage(logMessage: string) {
		if (this.report)
			this.report.appendLog(logMessage);
	}

	onActionStarted(action: Action<any>) {
		this.reports[action.uuid] = this.report = new ActionReport(action);
		// if (action.isContainer())
		this.reporter.onContainerStarted();
	}

	onActionEnded(action: Action<any>) {
		switch (action.status) {
			case Status.Ready:
			case Status.Running:
				this.logWarning(`action state: ${action.status} found in action ended event`)
				break;

			case Status.Skipped:
			case Status.Success:
			case Status.Error:
				this.reporter.onContainerEnded();
				if (action.isContainer()) {
					return;
				}

				this.summary[action.status]++;
				break;
		}
	}
}


export class ActionReport {
	constructor(action: Action) {
		this.action = action
	}

	readonly action: Action;
	private logs: string = "";

	getLog() {
		return this.logs;
	}

	appendLog(logMessage: string) {
		this.logs += `${logMessage}\n`;
	}
}

function pad(value: number, length: number) {
	let s = "" + value;
	while (s.length < (length || 2)) {
		s = "0" + s;
	}
	return s;
}

class ReporterLogClient
	extends LogClient {
	private report: Reporter;
	private indent: string = "";
	private static indent: string = "  ";

	constructor(report: Reporter) {
		super();
		this.report = report;
		this.setComposer(this.composer);
	}

	private composer = (tag: string, level: LogLevel): string => {
		const successPart = `\x1b[32m${pad(this.report.summary.Success, 3)}${NoColor}`;
		const skippedPart = `\x1b[90m\x1b[1m${pad(this.report.summary.Skipped, 3)}${NoColor}`;
		const errorPart = `\x1b[31m${pad(this.report.summary.Error, 3)}${NoColor}`;
		const status = `${errorPart}/${skippedPart}/${successPart}`;

		const defaultPrefix = DefaultLogPrefixComposer("Testelot", level);

		const color = LogClient_Terminal.getColor(level);

		return ` ${defaultPrefix} ${NoColor}[${status}]:${color} ${this.indent}`;
	}

	protected logMessage(level: LogLevel, bold: boolean, prefix: string, toLog: LogParam[]): void {
		const color = LogClient_Terminal.getColor(level, bold);
		const paramsAsStrings = _logger_convertLogParamsToStrings(toLog);
		paramsAsStrings.forEach(str => console.log(_logger_indentNewLineBy(color + prefix, str), NoColor))
	}

	onContainerStarted() {
		this.indent += ReporterLogClient.indent;
	}

	onContainerEnded() {
		this.indent = this.indent.substring(0, this.indent.length - ReporterLogClient.indent.length);
		return;
	}
}
