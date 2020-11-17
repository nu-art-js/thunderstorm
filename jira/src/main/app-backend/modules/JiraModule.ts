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
	Module,
	StringMap,
	TypedMap,
	_keys
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

type Config = {
	auth: JiraAuth
	baseUrl?: string
}

type JiraAuth = {
	email: string
	apiKey: string
};

export type JiraIssueType = {
	fields: JiraFields
}

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

type JiraFields = {
	project: JiraProjectInfo
	issuetype: IssueType
	description: JiraDescription
	summary: string
}

export type IssueType = {
	id: string
	name: string
}

export type JiraProjectInfo = {
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
	fields: JiraFields & StringMap
};

export type FixVersionType = {
	fixVersions: { name: string }[]
};

export type JiraQuery = TypedMap<string | string[]> & {
	status?: string | string[]
	project?: string | string[]
	fixVersion?: string | string[]
};

export type JiraQueryResponse = {
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

	protected init(): void {
		if (!this.config.baseUrl)
			throw new ImplementationMissingException("Missing Jira subdomain")

		if (!this.config.auth || !this.config.auth.apiKey || !this.config.auth.email)
			throw new ImplementationMissingException('Missing auth config variables for JiraModule');

		this.headersJson = this.buildHeaders(this.config.auth, true);
		this.headersForm = this.buildHeaders(this.config.auth, false);
	}

	buildHeaders = ({apiKey, email}: JiraAuth, check: boolean) => {
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

	createTextBody = (description: string) => {
		return {
			type: "doc",
			version: 1,
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: description
						}
					]
				}
			]
		};
	};

	createBody = (project: JiraProjectInfo, issueType: IssueType, summary: string, description: string): JiraIssueType => {
		return {
			fields: {
				project,
				issuetype: issueType,
				description: this.createTextBody(description),
				summary
			}
		}
	};

	createVersionBody = (data: any) => {
		return {
			fields: data
		}
	};

	getIssueTypes = async (id: string) => {
		console.log("here");
		return this.executeGetRequest('/issue/createmetadata', {projectKeys: id});
	};

	editIssue = (issueKey: string, data: FixVersionType | any) => {
		return this.executePutRequest(`/issue/${issueKey}`, this.createVersionBody(data));
	};

	private buildQuery = (query: JiraQuery) => {
		const params = _keys(query).map((key) => {
			let queryValue;
			if (Array.isArray(query[key])) {
				queryValue = (query[key] as string[]).map(value => `"${value}"`).join(",");
				queryValue = `(${queryValue})`
			} else
				queryValue = `"${query[key]}"`

			return `${key}=${queryValue}`;
		});
		return params.join(" and ")
	};

	query = async (query: JiraQuery): Promise<JiraIssue[]> => {
		const jql = this.buildQuery(query);
		return (await this.executeGetRequest<JiraQueryResponse>(`/search`, {jql})).issues;
	};

	postIssueRequest = async (project: JiraProjectInfo, issueType: IssueType, summary: string, description: string): Promise<ResponsePostIssue> => {
		return this.executePostRequest<ResponsePostIssue>('/issue', this.createBody(project, issueType, summary, description));
	};

	getIssueRequest = async (issue: string): Promise<JiraIssue> => {
		return this.executeGetRequest(`/issue/${issue}`)
	};

	addIssueAttachment = async (issue: string, file: Buffer) => {
		// formData.append("file", file);
		return this.executeFormRequest(`/issue/${issue}/attachments`, file)
	};

	addCommentRequest = (issue: string, comment: string) => {
		// create comment
		const obj = {
			body: this.createTextBody(comment)
		};
		return this.executePostRequest(`/issue/${issue}/comment`, obj)
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

	private async executePostRequest<T>(url: string, body: any) {
		const request: UriOptions & CoreOptions = {
			headers: this.headersJson,
			uri: `${this.config.baseUrl}${url}`,
			body,
			method: HttpMethod.POST,
			json: true
		};
		return this.executeRequest<T>(request);
	}

	private async executePutRequest(url: string, body: any) {
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

		console.log(`request: `, request)
		return this.executeRequest<T>(request);
	}

	private handleResponse<T>(response: Response) {
		if (`${response.statusCode}`[0] !== '2')
			throw new ApiException(response.statusCode, response.body)

		return response.toJSON().body as T;
	}

	private async executeRequest<T>(body: UriOptions & CoreOptions) {
		const response = await promisifyRequest(body, false);
		return this.handleResponse<T>(response);
	}
}

export const JiraModule = new JiraModule_Class();




