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

import {Module} from "@nu-art/ts-common";
import {XhrHttpModule} from "@nu-art/thunderstorm/frontend";
import {HttpMethod} from "@nu-art/thunderstorm";
import {
	ApiGetLog,
	ApiPostPath,
	DB_BugReport,
	Paths,
	ReportLogFile
} from "../../shared/api";

export const RequestKey_GetLog = "GetLog";
export const RequestKey_PostPath = "PostPath";

export class AdminBRModule_Class
	extends Module {

	constructor() {
		super();
	}

	private logs: DB_BugReport[] = [];

	public retrieveLogs = () => {
		this.logInfo("getting logs from firestore...");
		XhrHttpModule
			.createRequest<ApiGetLog>(HttpMethod.GET, RequestKey_GetLog)
			.setRelativeUrl("/v1/bug-reports/get-logs")
			.setOnError(`Error getting new message from backend`)
			.execute(async response => {
				this.logs = response
			});

		this.logInfo("continue... will receive an event once request is completed..");
	};

	public downloadLogs = (path: string) => {
		this.logInfo("downloading the logs to the client..");
		const bodyObject: Paths = {path: path};
		XhrHttpModule
			.createRequest<ApiPostPath>(HttpMethod.POST, RequestKey_PostPath)
			.setJsonBody(bodyObject)
			.setRelativeUrl("/v1/bug-reports/download-logs")
			.setOnError(`Error getting new message from backend`)
			.execute();
	};

	public downloadMultiLogs = (reports: ReportLogFile[]) => {
		reports.forEach(report => this.downloadLogs(report.path))
	}

	public getLogs = () => this.logs
}

export const AdminBRModule = new AdminBRModule_Class();