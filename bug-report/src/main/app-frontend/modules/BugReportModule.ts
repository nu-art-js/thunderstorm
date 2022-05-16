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

import {addItemToArray, BeLogged, LogClient_MemBuffer, LogLevel, LogLevelOrdinal, Module} from '@nu-art/ts-common';
import {XhrHttpModule} from '@nu-art/thunderstorm/frontend';
import {HttpMethod} from '@nu-art/thunderstorm';
import {ApiBugReport, Request_BugReport} from '../../shared/api';

export const RequestKey_BugReportApi = 'BugReport';

export class BugReportModule_Class
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

	sendBugReport = (subject: string, description: string, platforms?: string[]) => {
		const body: Request_BugReport = {
			subject,
			description,
			reports: this.reports.map(report => ({log: report.buffers, name: report.name})),
			platforms
		};

		XhrHttpModule
			.createRequest<ApiBugReport>(HttpMethod.POST, RequestKey_BugReportApi)
			.setJsonBody(body)
			.setRelativeUrl('/v1/bug-reports/report')
			.setOnError(() => this.logWarning(`Error updating the report`))
			.execute((response) => {
				// const jiraTicket = response.find(ticket => ticket.platform === Platform_Jira);
				// if(jiraTicket)
				// 	Dialog_JiraOpened.show(jiraTicket.issueId)
			});
	};
}

export const BugReportModule = new BugReportModule_Class();
