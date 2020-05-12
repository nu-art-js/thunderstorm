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

import * as React from "react";
import {
	AdminBRModule,
	RequestKey_GetLog
} from "../modules/AdminBRModule";
import {
	BaseComponent,
	OnRequestListener
} from "@nu-art/thunderstorm/frontend";
import {
	DB_BugReport,
	ReportLogFile
} from "../../shared/api";

export class AdminBR
	extends BaseComponent
	implements OnRequestListener {

	download = (paths: ReportLogFile[]) => paths.forEach(log => AdminBRModule.downloadLogs(log.path));

	private createTable() {
		return <table style={{width: "100%"}}>{AdminBRModule.getLogs().map(this.createRow)}</table>
	}

	private createRow = (report: DB_BugReport) => <tr>
		<td style={{padding: "15px", textAlign: "left", border: "1px solid #ddd", fontSize: "15px"}}>{report.description}</td>
		<td style={{padding: "15px", textAlign: "left", border: "1px solid #ddd", fontSize: "15px"}}>{report.reports[0].path}</td>
		<td style={{padding: "15px", textAlign: "left", border: "1px solid #ddd", fontSize: "15px"}}>{report.jiraKey}</td>
		<td style={{padding: "15px", textAlign: "left", border: "1px solid #ddd", fontSize: "15px"}}>
			<button onClick={() => this.download(report.reports)}>download</button>
		</td>
	</tr>;

	render() {
		return (
			<div>
				<button onClick={AdminBRModule.retrieveLogs}>click to display logs</button>
				<div>
					{this.createTable()}
				</div>
			</div>
		);
	}


	__onRequestCompleted = (key: string, success: boolean) => {
		switch (key) {
			default:
				return;

			case RequestKey_GetLog:
				this.forceUpdate()
		}
	};
}
