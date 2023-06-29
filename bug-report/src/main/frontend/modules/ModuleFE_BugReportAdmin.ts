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
import {apiWithBody, apiWithQuery} from '@nu-art/thunderstorm/frontend';
import {ApiDefCaller} from '@nu-art/thunderstorm';
import {ApiDef_AdminBugReport, ApiStruct_AdminBugReport, DB_BugReport, ReportLogFile} from '../../shared/api';


export const RequestKey_GetLog = 'GetLog';
export const RequestKey_PostPath = 'PostPath';

export class ModuleFE_BugReportAdmin_Class
	extends Module {
	readonly v1: ApiDefCaller<ApiStruct_AdminBugReport>['v1'];

	constructor() {
		super();
		this.v1 = {
			downloadLogs: apiWithBody(ApiDef_AdminBugReport.v1.downloadLogs),
			retrieveLogs: apiWithQuery(ApiDef_AdminBugReport.v1.retrieveLogs),
		};
	}

	private logs: DB_BugReport[] = [];

	// public retrieveLogs = () => {
	// 	this.logInfo('getting logs from firestore...');
	// 	ModuleFE_XHR
	// 		.createRequest<ApiGetLog>(HttpMethod.GET, RequestKey_GetLog)
	// 		.setRelativeUrl('v1/bug-reports/get-logs')
	// 		.setOnError(`Error getting new message from backend`)
	// 		.execute(async response => {
	// 			this.logs = response;
	// 		});
	//
	// 	this.logInfo('continue... will receive an event once request is completed..');
	// };

	// public downloadLogs = (path: string) => {
	// 	this.logInfo('downloading the logs to the client..');
	// 	const bodyObject: Paths = {path: path};
	// 	ModuleFE_XHR
	// 		.createRequest<ApiPostPath>(HttpMethod.POST, RequestKey_PostPath)
	// 		.setBodyAsJson(bodyObject)
	// 		.setRelativeUrl('v1/bug-reports/download-logs')
	// 		.setOnError(`Error getting new message from backend`)
	// 		.execute();
	// };

	public downloadMultiLogs = (reports: ReportLogFile[]) => {
		reports.forEach(report => this.v1.downloadLogs({path: report.path}).execute());
	};

	public getLogs = () => this.logs;
}

export const ModuleFE_BugReportAdmin = new ModuleFE_BugReportAdmin_Class();