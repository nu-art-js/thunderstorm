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
import {BadImplementationException, composeUrl, ImplementationMissingException, Module, TypedMap} from '@nu-art/ts-common';
import {ApiException, promisifyRequest} from '@nu-art/thunderstorm/backend';
import {HttpMethod} from '@nu-art/thunderstorm';
import {CoreOptions, Headers, Response, UriOptions} from 'request';
import {JiraIssueText, JiraUtils} from './utils';
import {JiraVersion, JiraVersion_Create} from '../../shared/version';


type Config = {
	auth: JiraAuth
	defaultAssignee: JiraUser,
	baseUrl?: string
}

type JiraAuth = {
	email: string
	apiKey: string
};

type JiraUser = {
	accountId: string,
	name?: string,
	email?: string
}

type JiraMark = {
	type: string
	attrs: {
		href: string
	}
}

type JiraContent = {
	type: 'paragraph' | string
	text?: string
	marks?: JiraMark[]
	content?: JiraContent[]
}

type JiraDescription = string | {
	type: 'doc' | string
	version: number
	content: JiraContent[]
}

export type JiraIssue_Fields = {
	project: JiraProject
	// project: JiraProjectInfo
	issuetype: IssueType
	description: JiraDescription
	summary: string
	reporter?: { id: string }
} & TypedMap<any>

export type IssueType = {
	id?: string
	name: string
}

export type LabelType = {
	label: string[]
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
	url: string
};

export type JiraIssue = BaseIssue & {
	expand: string
	fields: JiraIssue_Fields
};

export type FixVersionType = {
	fixVersions: { name: string }[]
};

export type QueryItemWithOperator = {
	value: string,
	operator: string
}

export type JiraQuery = TypedMap<string | string[] | QueryItemWithOperator> & {
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

export class ModuleBE_Jira_Class
	extends Module<Config> {
	private headersJson!: Headers;
	private headersForm!: Headers;
	private projects!: JiraProject[];
	private versions: { [projectId: string]: JiraVersion[] } = {};
	private restUrl!: string;

	protected init(): void {
		if (!this.config.baseUrl)
			throw new ImplementationMissingException('Missing Jira baseUrl for JiraModule, please add the key baseUrl to the config');

		this.restUrl = this.config.baseUrl + '/rest/api/3';
		console.log(this.restUrl);
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
				this.projects = await this.executeGetRequest<JiraProject[]>(`/project`);

			const project = this.projects.find(_project => _project.key === projectKey);
			if (!project)
				throw new BadImplementationException(`Could not find project: ${projectKey}`);

			return project;
		},
	};

	version = {
		query: async (projectId: string, versionName: string) => {
			if (!this.versions[projectId])
				this.versions[projectId] = await this.executeGetRequest<JiraVersion[]>(`/project/${projectId}/versions`);

			return this.versions[projectId].find(version => version.name === versionName);
		},
		create: async (projectId: string, versionName: string) => {
			const version = await this.executePostRequest<JiraVersion, JiraVersion_Create>(`/version`, {projectId, name: versionName});
			this.versions[projectId].push(version);
			return version;
		}
	};

	comment = {
		add: async (issueKey: string, comment: string) => {
			return this.executePostRequest(`/issue/${issueKey}/comment`, JiraUtils.createText(comment));
		}
	};

	issue = {
		query: async (query: JiraQuery): Promise<JiraIssue[]> => {
			return (await this.executeGetRequest<JiraResponse_IssuesQuery>(`/search`, {jql: JiraUtils.buildJQL(query)})).issues;
		},
		get: async (issueId: string): Promise<JiraIssue> => {
			return this.executeGetRequest(`/issue/${issueId}`);
		},
		comment: this.comment,
		create: async (project: JiraProject, issueType: IssueType, summary: string, descriptions: JiraIssueText[], label: string[]): Promise<ResponsePostIssue> => {
			const issue = await this.executePostRequest<ResponsePostIssue, Pick<JiraIssue, 'fields'>>('/issue', {
				fields: {
					project,
					issuetype: issueType,
					description: JiraUtils.createText(...descriptions),
					summary,
					labels: label,
					assignee: {
						accountId: this.config.defaultAssignee.accountId
					}
				}
			});
			issue.url = `${this.config.baseUrl}/browse/${issue.key}`;
			return issue;
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
	};

	getIssueTypes = async (id: string) => {
		return this.executeGetRequest('/issue/createmetadata', {projectKeys: id});
	};

	query = async (query: JiraQuery): Promise<JiraIssue[]> => {
		return (await this.executeGetRequest<JiraResponse_IssuesQuery>(`/search`, {jql: JiraUtils.buildJQL(query)})).issues;
	};

	getIssueRequest = async (issueId: string): Promise<JiraIssue> => {
		return this.executeGetRequest(`/issue/${issueId}`);
	};

	addIssueAttachment = async (issue: string, file: Buffer) => {
		return this.executeFormRequest(`/issue/${issue}/attachments`, file);
	};

	private executeFormRequest = async (url: string, buffer: Buffer) => {
		const request: UriOptions & CoreOptions = {
			headers: this.headersForm,
			uri: `${this.restUrl}${url}`,
			formData: createFormData('logs.zip', buffer),
			method: HttpMethod.POST,
		};
		return this.executeRequest(request);
	};

	private async executePostRequest<Res, Req>(url: string, body: Req, label?: string[]) {
		const request: UriOptions & CoreOptions = {
			headers: this.headersJson,
			uri: `${this.restUrl}${url}`,
			body,
			method: HttpMethod.POST,
			json: true
		};
		return this.executeRequest<Res>(request);
	}

	private async executePutRequest<T>(url: string, body: T) {
		const request: UriOptions & CoreOptions = {
			headers: this.headersJson,
			uri: `${this.restUrl}${url}`,
			body,
			method: HttpMethod.PUT,
			json: true
		};
		return this.executeRequest(request);
	}

	// async executeGetRequestNew<T>(url: string, _params?: { [k: string]: string }): Promise<T> {
	// 	if (!this.restUrl)
	// 		throw new ImplementationMissingException('Need a baseUrl');
	//
	// 	return AxiosHttpModule
	// 		.createRequest(HttpMethod.GET, generateHex(8))
	// 		.setOrigin(this.restUrl)
	// 		.setUrl(url)
	// 		.setUrlParams(_params)
	// 		.setHeaders(this.headersJson)
	// 		.executeSync();
	// }

	private handleResponse<T>(response: Response) {
		if (`${response.statusCode}`[0] !== '2')
			throw new ApiException(response.statusCode, response.body);

		return response.toJSON().body as T;
	}

	private async executeGetRequest<T>(url: string, _params?: { [k: string]: string }) {

		const request: UriOptions & CoreOptions = {
			headers: this.headersJson,
			uri: `${composeUrl(`${this.restUrl}${url}`, _params)}`,
			method: HttpMethod.GET,
			json: true
		};

		return this.executeRequest<T>(request);
	}

	private async executeRequest<T>(request: UriOptions & CoreOptions) {
		const response = await promisifyRequest(request, false);
		return this.handleResponse<T>(response);
	}
}

export const JiraModule = new ModuleBE_Jira_Class();

