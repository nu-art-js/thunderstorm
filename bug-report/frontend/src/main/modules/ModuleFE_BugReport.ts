/*
 * Allow the user to file a bug  report directly from your app
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

import {addItemToArray, BeLogged, LogClient_MemBuffer, LogLevel, LogLevelOrdinal, Module} from '@nu-art/ts-common';
import {ApiCaller} from '@nu-art/http-client';
import {ApiDef_BugReport, Request_BugReport, TicketDetails} from '@nu-art/bug-report-shared/api';


export const RequestKey_BugReportApi = 'BugReport';

export class ModuleFE_BugReport_Class
	extends Module {

	private readonly reports: LogClient_MemBuffer[] = [];

	constructor() {
		super();
		addItemToArray(this.reports, new LogClient_MemBuffer('default'));
		addItemToArray(this.reports, new LogClient_MemBuffer('info')
			.setFilter(level => LogLevelOrdinal.indexOf(level) >= LogLevelOrdinal.indexOf(LogLevel.Info)));
	}

	protected init(): void {
		this.reports.forEach(report => BeLogged.addClient(report));
	}

	@ApiCaller(ApiDef_BugReport.sendBugReport)
	async sendBugReport(body: Request_BugReport): Promise<TicketDetails[]> {
		void body;
		return [];
	}
}

export const ModuleFE_BugReport = new ModuleFE_BugReport_Class();
