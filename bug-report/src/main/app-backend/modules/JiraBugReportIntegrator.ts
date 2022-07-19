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
	ImplementationMissingException,
	Module
} from "@nu-art/ts-common";
import {
	IssueType,
	JiraIssueText,
	JiraModule,
	JiraProject,
	LabelType
} from "@nu-art/jira";
import {
	Platform_Jira,
	ReportLogFile,
	Request_BugReport
} from "../..";
import {TicketDetails} from "./ModuleBE_BugReport";

type Config = {
	jiraProject: JiraProject
	issueType: IssueType
	label: LabelType
}

export class JiraBugReportIntegrator_Class
	extends Module<Config> {

	setIssueTitleProcessor(parser: (name: string) => string) {
		this.parser = parser;
	}

	private parser = (name: string) => `Bug: ${name}`;

	openTicket = async (bugReport: Request_BugReport, logs: ReportLogFile[], reporter?: string): Promise<TicketDetails | undefined> => {
		if (bugReport.platforms && !bugReport.platforms.includes(Platform_Jira))
			return;

		if (!this.config.jiraProject)
			throw new ImplementationMissingException("missing Jira project in bug report configurations");

		const description = logs.reduce((carry: JiraIssueText[], log: ReportLogFile, i: number) => {
			carry.push({href: log.path, text: "\nClick to view logs (" + i + ")"});
			return carry;
		}, [bugReport.description]);

		if (reporter)
			description.push("\nReported by: " + reporter);

		const issue = await JiraModule.issue.create(this.config.jiraProject, this.config.issueType, this.parser(bugReport.subject), description,
		                                            this.config.label.label);
		return {platform: Platform_Jira, issueId: issue.url};
	};
}

export const JiraBugReportIntegrator = new JiraBugReportIntegrator_Class();