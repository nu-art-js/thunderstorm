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
import {apiWithBody} from '@nu-art/thunderstorm/frontend';
import {ApiDefCaller} from '@nu-art/thunderstorm';
import {ApiDef_BugReport, ApiStruct_BugReport} from '../../shared/api';
import {TicketDetails} from '../../backend';


export const RequestKey_BugReportApi = 'BugReport';

export class ModuleFE_BugReport_Class
	extends Module {

	private readonly reports: LogClient_MemBuffer[] = [];
	readonly v1: ApiDefCaller<ApiStruct_BugReport>['v1'];

	constructor() {
		super();
		addItemToArray(this.reports, new LogClient_MemBuffer('default'));
		addItemToArray(this.reports, new LogClient_MemBuffer('info')
			.setFilter(level => LogLevelOrdinal.indexOf(level) >= LogLevelOrdinal.indexOf(LogLevel.Info)));

		this.v1 = {
			sendBugReport: apiWithBody(ApiDef_BugReport.v1.sendBugReport, this.sendBugReportCallback),
		};
	}

	protected init(): void {
		this.reports.forEach(report => BeLogged.addClient(report));
	}

	private sendBugReportCallback = async (response: TicketDetails[]) => {
		// const jiraTicket = response.find(ticket => ticket.platform === Platform_Jira);
		// if(jiraTicket)
		// 	Dialog_JiraOpened.show(jiraTicket.issueId)
	};
}

export const ModuleFE_BugReport = new ModuleFE_BugReport_Class();
