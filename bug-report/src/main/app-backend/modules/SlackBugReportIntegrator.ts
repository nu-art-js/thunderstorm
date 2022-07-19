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

import {
	generateHex,
	ImplementationMissingException,
	Module
} from "@nu-art/ts-common";
import {
	Platform_Slack,
	ReportLogFile,
	Request_BugReport
} from "../..";
import {TicketDetails} from "./ModuleBE_BugReport";
import {SlackModule} from "@nu-art/storm/slack";

type Config = {
	channel: string
}

export class SlackBugReportIntegrator_Class
	extends Module<Config> {

	openTicket = async (bugReport: Request_BugReport, logs: ReportLogFile[], reporter?: string): Promise<TicketDetails | undefined> => {
		if(bugReport.platforms && !bugReport.platforms.includes(Platform_Slack))
			return;

		if (!this.config.channel)
			throw new ImplementationMissingException("Missing Slack Channel in bug report configurations");

		let description = logs.reduce((carry: string, log: ReportLogFile, i: number) => {
			return carry + "\n" + `<${log.path}|Click to view logs (${i})>`;
		}, bugReport.subject + "\n" + bugReport.description);

		if (reporter)
			description += "\nReported by: " + reporter;

		const slackMessage = {
			text: description,
			channel: this.config.channel
		};
		await SlackModule.postMessage(slackMessage)
		return {platform: Platform_Slack, issueId: generateHex(32)};
	};
}

export const SlackBugReportIntegrator = new SlackBugReportIntegrator_Class();