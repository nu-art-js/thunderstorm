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
	StringMap
} from "@nu-art/ts-common";
import {
	ApiException,
	promisifyRequest
} from "@nu-art/thunderstorm/backend";
import {HttpMethod} from "@nu-art/thunderstorm";
import {
	CoreOptions,
	Headers,
	Response,
	UriOptions
} from 'request';

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

type JiraReporter = {
	id: string
}

type JiraFields = {
	project: JiraProjectInfo
	issuetype: IssueType
	description: JiraDescription
	summary: string
	reporter?: JiraReporter
}

export type IssueType = {
	id: string
} | {
	name: string
}

export type JiraProjectInfo = {
	id: string,
	baseUrl:string
} | {
	name: string,
	baseUrl:string
} | {
	key: string,
	baseUrl:string
}

export type ResponseGetIssue = BaseIssue & {
	expand: string
	fields: StringMap
};

export type BaseIssue = {
	id: string
	key: string
	self: string
};

export type FixVersionType = {
	fixVersions: { name: string }[]
};

export type ResponsePostIssue = BaseIssue;

type TextWithLink = { text: string, link: string, linkText: string, email:string }

const createFormData = (filename: string, buffer: Buffer) => ({file: {value: buffer, options: {filename}}});

export class JiraModule_Class
	extends Module<Config> {
	private headersJson!: Headers;
	private headersForm!: Headers;
	private baseUrl = "https://introb.atlassian.net/rest/api/3";

	protected init(): void {
		if (this.config?.baseUrl)
			this.baseUrl = this.config?.baseUrl;

		if (!this.config?.auth?.email || !this.config.auth.apiKey)
			throw new ImplementationMissingException('Missing right config variables for JiraModule');

		console.log('jira configs: ', this.config.auth);
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

	createTextBody = (description: TextWithLink) => {
		return {
			type: "doc",
			version: 1,
			content: [
				{
					type: "paragraph",
					content: [
						{
							"type": "text",
							"text": description.text
						},
						{
							"type": "text",
							"text": description.email
						},
						{
							type: "text",
							text: description.linkText,
							marks: [
								{
									type: "link",
									attrs: {
										href: description.link
									}
								}
							]
						}
					]
				}
			]
		};
	};


	createBody = (project: JiraProjectInfo, issueType: IssueType, summary: string, description: TextWithLink, email?: string): JiraIssueType => {
		const body: JiraIssueType = {
			fields: {
				project,
				issuetype: issueType,
				description: this.createTextBody(description),
				summary
			}
		};
		return body;
	};

	createVersionBody = (data: any) => {
		return {
			fields: data
		};
	};

	getIssueTypes = async (id: string) => {
		console.log("here");
		return this.executeGetRequest('/issue/createmetadata', {projectKeys: id});
	};

	editIssue = (issueKey: string, data: FixVersionType | any) => {
		return this.executePutRequest(`/issue/${issueKey}`, this.createVersionBody(data));
	};

	private buildSearch = (params: StringMap) => {
		const search = Object.keys(params).reduce((carry, key) => {
			return `${carry}${carry.length !== 0 ? '%20and%20' : ''}${key}${key === 'project' ? '=' : '~'}${encodeURIComponent(params[key])}`;
		}, '');
		return 'jql=' + (search);
	};

	getIssueByCustomField = async (project: string, query: StringMap) => {
		// return this.executeGetRequest('/search?jql=summary~'+summary+'&project='+project)
		const search = this.buildSearch({project, ...query});
		return this.executeGetRequest(`/search?${search}`);
	};


	postIssueRequest = async (project: JiraProjectInfo, issueType: IssueType, summary: string, description: TextWithLink, email?: string): Promise<ResponsePostIssue> => {
		return this.executePostRequest('/issue', this.createBody(project, issueType, summary, description, email));
	};

	getIssueRequest = async (issue: string): Promise<ResponseGetIssue> => {
		return this.executeGetRequest(`/issue/${issue}`);
	};

	addIssueAttachment = async (issue: string, file: Buffer) => {
		// formData.append("file", file);
		return this.executeFormRequest(`/issue/${issue}/attachments`, file);
	};

	addCommentRequest = (issue: string, comment: TextWithLink) => {
		// create comment
		const obj = {
			body: this.createTextBody(comment)
		};
		return this.executePostRequest(`/issue/${issue}/comment`, obj);
	};


	// editDescriptionRequest = (issue: string, description: string) => {
	// 	// No idea
	// 	const request: UriOptions & CoreOptions = {
	// 		headers: this.headersJson,
	// 		uri: '/issue/' + issue,
	// 		method: 'PUT',
	// 		body: description,
	// 		json: true
	// 	};
	// 	return this.executeRequest(request)
	// };

	private executeFormRequest = async (url: string, buffer: Buffer) => {
		const request: UriOptions & CoreOptions = {
			headers: this.headersForm,
			uri: `${this.baseUrl}${url}`,
			formData: createFormData('logs.zip', buffer),
			method: HttpMethod.POST,
		};
		return this.executeRequest(request);
	};

	private async executePostRequest(url: string, body: any, email?: string) {
		const request: UriOptions & CoreOptions = {
			headers: this.headersJson,
			uri: `${this.baseUrl}${url}`,
			body,
			method: HttpMethod.POST,
			json: true,
		};
		console.log('this is the body: ', body);

		return this.executeRequest(request);
	}

	private async executePutRequest(url: string, body: any) {
		const request: UriOptions & CoreOptions = {
			headers: this.headersJson,
			uri: `${this.baseUrl}${url}`,
			body,
			method: HttpMethod.PUT,
			json: true
		};
		return this.executeRequest(request);
	}


	private async executeGetRequest(url: string, _params?: { [k: string]: string }) {
		const params = _params && Object.keys(_params).map((key) => {
			return `${key}=${_params[key]}`;
		});

		let urlParams = "";
		if (params && params.length > 0)
			urlParams = `?${params.join("&")}`;

		const request: UriOptions & CoreOptions = {
			headers: this.headersJson,
			uri: `${this.baseUrl}${url}${urlParams}`,
			method: HttpMethod.GET,
			json: true
		};
		return this.executeRequest(request);
	}

	private handleResponse(response: Response) {
		console.log('this is the response code: ', response.statusCode);
		if (`${response.statusCode}`[0] !== '2')
			throw new ApiException(response.statusCode, response.body);

		console.log(response.toJSON().body);
		return response.toJSON().body;
	}

	private async executeRequest(body: UriOptions & CoreOptions) {
		const response = await promisifyRequest(body, false);
		return this.handleResponse(response);
	}
}

export const JiraModule = new JiraModule_Class();




