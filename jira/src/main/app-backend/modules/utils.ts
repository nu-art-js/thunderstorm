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

import {_keys} from "@nu-art/ts-common";
import {
	JiraQuery,
	QueryItemWithOperator
} from "./JiraModule";

export type JiraIssueText = string | { href: string, text: string };

function createText(...texts: JiraIssueText[]) {
	return {
		type: "doc",
		version: 1,
		content: [
			{
				type: "paragraph",
				content: texts.map(text => {
					if (typeof text === "string")
						return {
							type: "text",
							text
						};

					return  {
						type: "text",
						text: text.text,
						marks: [
							{
								type: "link",
								attrs: {
									href: text.href
								}
							}
						]
					}

				})
			}
		]
	};
}

function buildJQL(query: JiraQuery) {
	const params = _keys(query).map((key) => {
		let queryValue;
		let operator = '=';
		if (Array.isArray(query[key])) {
			queryValue = (query[key] as string[]).map(value => `"${value}"`).join(",");
			queryValue = `(${queryValue})`;
		} else if (typeof query[key] === 'object') {
			const queryItemWithOperator = query[key] as QueryItemWithOperator;
			queryValue = `"${queryItemWithOperator.value}"`
			operator = queryItemWithOperator.operator;
		} else
			queryValue = `"${query[key]}"`;

		return `${key}${operator}${queryValue}`;
	});
	return params.join(" and ");
}

export const JiraUtils = {
	createText,
	buildJQL,
}