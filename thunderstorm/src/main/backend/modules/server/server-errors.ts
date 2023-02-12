/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
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

import {ApiException} from '../../exceptions';
import {__stringify, _keys, StringMap, isErrorOfType, StaticLogger} from '@nu-art/ts-common';
import {HttpErrorHandler, HttpRequestData} from '../../utils/types';


export type AppPropsResolver = (requestData: HttpRequestData) => Promise<StringMap>;
const _propsResolver: AppPropsResolver = async () => {
	return {} as StringMap;
};

export function DefaultApiErrorMessageComposer(headersToAttach: string[] = [], propsResolver: AppPropsResolver = _propsResolver): HttpErrorHandler {
	return async (requestData: HttpRequestData, error: ApiException) => {
		const {headers, query, url, body} = requestData;

		const props = await propsResolver(requestData);
		StaticLogger.logInfo('props: ', props);
		let slackMessage = '';
		slackMessage += `${error ? error.responseCode : '000'} - ${url}   \n\n`;

		const propsAsString = _keys(props).reduce((toRet, key) => {
			return `${toRet}    ${key}: ${props[key]}\n`;
		}, '');

		if (props && Object.keys(props).length > 0)
			slackMessage += `App Data:\n${propsAsString}\n`;

		if (error) {
			const cause = error.cause || error;
			if (cause && cause.stack) {
				slackMessage += `${cause.stack
					.replace(/\/srv\/dist\//g, '@')
					.replace(/\/srv\/node_modules/g, '')
					.replace(/\\n/g, `\n`)
					.replace(/\\"/g, `"`)
					.replace(/\\t/g, '')
					.replace(/\/@nu-art/g, '')}\n`;
				slackMessage += '--------------------------------------------------------------------------------------\n';
			}
		}

		const _headers = _keys(headers).reduce((toRet, key) => {
			if (headersToAttach.includes(key as string))
				toRet[key] = headers[key];

			return toRet;
		}, {} as { [k: string]: string | string[] | undefined });

		if (_headers && Object.keys(_headers).length > 0)
			slackMessage += `Headers: ${__stringify(_headers)}\n`;
		else
			slackMessage += 'Headers: -- No Included Headers --\n';

		if (query) {
			if (query && Object.keys(query).length > 0)
				slackMessage += `Query: ${__stringify(query, true)}\n`;
			else
				slackMessage += 'Query: -- No Query --\n';
		}

		if (body) {
			if (body && Object.keys(body).length > 0)
				slackMessage += `Body: ${__stringify(body)}\n`;
			else
				slackMessage += 'Body: -- No Body --\n';
		}

		if (isErrorOfType(error.cause || error, ApiException)?.responseBody)
			slackMessage += `Error: ${__stringify(isErrorOfType(error.cause || error, ApiException)!.responseBody.error, true)}`;

		return slackMessage;
	};
}
