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

import {Module} from '@nu-art/ts-common';
import {ApiCaller} from '@nu-art/http-client';
import {API_AdminBugReport, ApiDef_AdminBugReport, DB_BugReport, ReportLogFile} from '@nu-art/bug-report-shared/api';


export const RequestKey_GetLog = 'GetLog';
export const RequestKey_PostPath = 'PostPath';

export class ModuleFE_BugReportAdmin_Class
	extends Module {

	private logs: DB_BugReport[] = [];

	constructor() {
		super();
	}

	@ApiCaller(ApiDef_AdminBugReport.retrieveLogs, {
		onComplete: (m, ctx) => m.setLogs(ctx.response)
	})
	async retrieveLogs(_params?: API_AdminBugReport['retrieveLogs']['Params']): Promise<API_AdminBugReport['retrieveLogs']['Response']> {
		void _params;
		return undefined as unknown as API_AdminBugReport['retrieveLogs']['Response'];
	}

	@ApiCaller(ApiDef_AdminBugReport.downloadLogs)
	async downloadLogs(body: API_AdminBugReport['downloadLogs']['Body']): Promise<API_AdminBugReport['downloadLogs']['Response']> {
		void body;
		return undefined as unknown as API_AdminBugReport['downloadLogs']['Response'];
	}

	public downloadMultiLogs = (reports: ReportLogFile[]) => {
		reports.forEach(report => void this.downloadLogs({path: report.path}));
	};

	public getLogs = (): DB_BugReport[] => this.logs;

	setLogs(logs: DB_BugReport[]): void {
		this.logs = logs;
	}
}

export const ModuleFE_BugReportAdmin = new ModuleFE_BugReportAdmin_Class();
