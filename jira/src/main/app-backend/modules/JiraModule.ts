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
	_keys,
	BadImplementationException,
	ImplementationMissingException,
	Module,
	TypedMap
} from "@nu-art/ts-common";
import {
	ApiException,
	promisifyRequest
} from "@nu-art/thunderstorm/backend"
import {HttpMethod} from "@nu-art/thunderstorm"
import {
	CoreOptions,
	Headers,
	Response,
	UriOptions
} from 'request'
import {
	JiraVersion,
	JiraVersion_Create
} from "../../shared/version";
import {JiraUtils} from "./utils";

type Config = {
	auth: JiraAuth
	baseUrl?: string
}

type JiraAuth = {
	email: string
	apiKey: string
};

type JiraContent = {
	type: "paragraph" | string
	text?: string
	content?: JiraContent[]
}

type JiraDescription = string | {
	type: "doc" | string
	version: number
	content: JiraContent[]
}

export type JiraIssue_Fields = {
	project: JiraProject
	issuetype: IssueType
	description: JiraDescription
	summary: string
} & TypedMap<any>

export type IssueType = {
	id: string
	name: string
}

export type JiraProject = {
	id: string
	name: string
	key: string
}

export type BaseIssue = {
	id: string
	key: string
	self: string
};

export type JiraIssue = BaseIssue & {
	expand: string
	fields: JiraIssue_Fields
};

export type FixVersionType = {
	fixVersions: { name: string }[]
};

export type JiraQuery = TypedMap<string | string[]> & {
	status?: string | string[]
	project?: string | string[]
	fixVersion?: string | string[]
};

export type JiraResponse_IssuesQuery = {
	expand: string,
	startAt: number,
	maxResults: number,
	total: number,
	issues: JiraIssue[]
}
export type ResponsePostIssue = BaseIssue;

const createFormData = (filename: string, buffer: Buffer) => ({file: {value: buffer, options: {filename}}});

export class JiraModule_Class
	extends Module<Config> {
	private headersJson!: Headers;
	private headersForm!: Headers;
	private projects!: JiraProject[];
	private versions: { [projectId: string]: JiraVersion[] }= {};

	protected init(): void {
		if (!this.config.baseUrl)
			throw new ImplementationMissingException("Missing Jira subdomain")

		if (!this.config.auth || !this.config.auth.apiKey || !this.config.auth.email)
			throw new ImplementationMissingException('Missing auth config variables for JiraModule');

		this.headersJson = this.buildHeaders(this.config.auth, true);
		this.headersForm = this.buildHeaders(this.config.auth, false);
	}

	private buildHeaders = ({apiKey, email}: JiraAuth, check: boolean) => {
		const headers: Headers = {
			Authorization: `Basic ${Buffer.from(email + ':' + apiKey).toString('base64')}`
		};

		if (!check) {
			headers['X-Atlassian-Token'] = 'no-check';
			headers['Content-Type'] = 'multipart/form-data';
		} else {
			headers.Accept = 'application/json';
			headers['Content-Type'] = 'application/json';
		}

		return headers;
	};

	project = {
		query: async (projectKey: string) => {
			if (!this.projects)
				this.projects = await this.executeGetRequest<JiraProject[]>(`/project`)

			const project = this.projects.find(project => project.key === projectKey);
			if (!project)
				throw new BadImplementationException(`Could not find project: ${projectKey}`)

			return project;
		},
	}

	version = {
		query: async (projectId: string, versionName: string) => {
			if (!this.versions[projectId])
				this.versions[projectId] = await this.executeGetRequest<JiraVersion[]>(`/project/${projectId}/versions`);

			return this.versions[projectId].find(version => version.name === versionName);
		},
		create: async (projectId: string, versionName: string) => {
			const version = await this.executePostRequest<JiraVersion, JiraVersion_Create>(`/version`, {projectId, name: versionName});
			this.versions[projectId].push(version);
			return version
		}
	}

	comment = {
		add: async (issueKey: string, comment: string) => {
			return this.executePostRequest(`/issue/${issueKey}/comment`, JiraUtils.createText(comment))
		}
	}

	issue = {
		comment: this.comment,
		create: async (project: JiraProject, issueType: IssueType, summary: string, description: string): Promise<ResponsePostIssue> => {
			return this.executePostRequest<ResponsePostIssue, Pick<JiraIssue, "fields">>('/issue', {
				fields: {
					project,
					issuetype: issueType,
					description: JiraUtils.createText(description),
					summary
				}
			});
		},
		update: async (issueKey: string, fields: Partial<JiraIssue_Fields>) => {
			return this.executePutRequest<{ fields: Partial<JiraIssue_Fields> }>(`/issue/${issueKey}`, {fields});
		},
		resolve: async (issueKey: string, projectKey: string, versionName: string, status: string) => {
			const project = await JiraModule.project.query(projectKey);
			let version = await JiraModule.version.query(projectKey, versionName);
			if (!version)
				version = await JiraModule.version.create(project.id, versionName);

			return this.executePutRequest<{ fields: Partial<JiraIssue_Fields> }>(`/issue/${issueKey}`, {fields: {fixVersions: [{id: version.id}]}});
		},
	}

	getIssueTypes = async (id: string) => {
		return this.executeGetRequest('/issue/createmetadata', {projectKeys: id});
	};


	query = async (query: JiraQuery): Promise<JiraIssue[]> => {
		return (await this.executeGetRequest<JiraResponse_IssuesQuery>(`/search`, {jql: JiraUtils.buildJQL(query)})).issues;
	};

	getIssueRequest = async (issue: string): Promise<JiraIssue> => {
		return this.executeGetRequest(`/issue/${issue}`)
	};

	addIssueAttachment = async (issue: string, file: Buffer) => {
		return this.executeFormRequest(`/issue/${issue}/attachments`, file)
	};

	private executeFormRequest = async (url: string, buffer: Buffer) => {
		const request: UriOptions & CoreOptions = {
			headers: this.headersForm,
			uri: `${this.config.baseUrl}${url}`,
			formData: createFormData('logs.zip', buffer),
			method: HttpMethod.POST,
		};
		return this.executeRequest(request);
	};

	private async executePostRequest<Res, Req>(url: string, body: Req) {
		const request: UriOptions & CoreOptions = {
			headers: this.headersJson,
			uri: `${this.config.baseUrl}${url}`,
			body,
			method: HttpMethod.POST,
			json: true
		};
		return this.executeRequest<Res>(request);
	}

	private async executePutRequest<T>(url: string, body: T) {
		const request: UriOptions & CoreOptions = {
			headers: this.headersJson,
			uri: `${this.config.baseUrl}${url}`,
			body,
			method: HttpMethod.PUT,
			json: true
		};
		return this.executeRequest(request);
	}

	private async executeGetRequest<T>(url: string, _params?: { [k: string]: string }) {
		const params = _params && Object.keys(_params).map((key) => {
			return `${key}=${_params[key]}`;
		});

		let urlParams = "";
		if (params && params.length > 0)
			urlParams = `?${params.join("&")}`;

		const request: UriOptions & CoreOptions = {
			headers: this.headersJson,
			uri: `${this.config.baseUrl}${url}${urlParams}`,
			method: HttpMethod.GET,
			json: true
		};

		return this.executeRequest<T>(request);
	}

	private handleResponse<T>(response: Response) {
		if (`${response.statusCode}`[0] !== '2')
			throw new ApiException(response.statusCode, response.body)

		return response.toJSON().body as T;
	}

	private async executeRequest<T>(request: UriOptions & CoreOptions) {
		console.log(`request: `, request.uri)
		const response = await promisifyRequest(request, false);
		return this.handleResponse<T>(response);
	}
}

export const JiraModule = new JiraModule_Class();

