import {
	ApiResponse,
	ServerApi_Post,
} from "@nu-art/thunderstorm/backend";
import * as express from "express";
import {
	ApiBugReport,
	Request_BugReport
} from "./_imports";

import {
	BugReportModule
} from "./_imports";
// import {AccountModule} from "@nu-art/user-account/backend";

class ServerApi_SendReport
	extends ServerApi_Post<ApiBugReport> {

	constructor() {
		super("report");
	}

	protected async process(request: express.Request, response: ApiResponse, queryParams: {}, body: Request_BugReport) {
		// const email = await AccountModule.validateSession(request);
		await BugReportModule.saveFile(body);
	}
}

module.exports = new ServerApi_SendReport();
