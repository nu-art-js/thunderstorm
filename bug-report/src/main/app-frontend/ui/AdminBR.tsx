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
