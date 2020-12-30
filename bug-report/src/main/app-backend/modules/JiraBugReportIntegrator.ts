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
	JiraModule,
	JiraProjectInfo
} from "@nu-art/jira";
import {
	ReportLogFile,
	Request_BugReport
} from "../..";
import {TicketDetails} from "./BugReportModule";

type Config = {
	jiraProject: JiraProjectInfo
}

export class JiraBugReportIntegrator_Class
	extends Module<Config> {

	private bugName = ''

	protected init(): void {
		super.init();
	}

	setBugName = (name:string) => this.bugName = name

	openTicket = async (bugReport: Request_BugReport, logs: ReportLogFile[], email?: string): Promise<TicketDetails> => {
		// const description = logs.reduce((carry, el) => `${carry}${el.path}, `, `${bugReport.description}, `);
		if (!this.config.jiraProject)
			throw new ImplementationMissingException("missing Jira project in bug report configurations");

		const description = {text:`${bugReport.description }\n`, link: logs[0].path, linkText: 'Click to view logs', email: `Reported by: ${email}\n`}

		console.log(this.config.jiraProject);
		const message = await JiraModule.postIssueRequest(this.config.jiraProject, {name: "Bug"}, `${this.bugName} ${bugReport.subject}`,
		                                                  description, email);
		return {platform: "jira", issueId: `${this.config.jiraProject.baseUrl}/browse/${message.key}`};
	};
}

export const JiraBugReportIntegrator = new JiraBugReportIntegrator_Class();