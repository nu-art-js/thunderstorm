/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
 *
 * Copyright (C) 2020 Intuition Robotics
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
    __custom,
    __scenario
} from "@ir/testelot";
import {JiraModule} from "../../main/app-backend/modules/JiraModule";
import {
    assert,
    generateHex,
    StringMap
} from "@ir/ts-common";

const JSZip = require('jszip');

const baseProject = {
	id: "10030",
	key: "EAT"
};

export const issueScenario = __scenario('Issue');
const mySummary = generateHex(16);
let key: string;
let id: string;
const createIssue = __custom(async () => {
	const resp = await JiraModule.postIssueRequest(baseProject, {name: "Task"}, mySummary, "buggy!");
	key = resp.key;
}).setLabel('Create Issue');

const readIssue = __custom(async () => {
	const resp = await JiraModule.getIssueRequest(key);
	assert(`Summary doesn't match`, mySummary, resp.fields.summary)
}).setLabel('Retrieve issue');

const attachFile = __custom(async () => {
	const zip = new JSZip();
	zip.file('test.txt', generateHex(100));
	const buffer = await zip.generateAsync({type: "nodebuffer"});
	await JiraModule.addIssueAttachment(key, buffer)
}).setLabel('Retrieve issue');

const getIssueTypes = __custom(async () => {
	const resp = await JiraModule.getIssueTypes(baseProject.key);
	console.log(resp)
}).setLabel('Get Issue type');

const addComment = __custom(async () => {
	const resp = await JiraModule.addCommentRequest(id, "updating Alan's unit comments");
	console.log(resp)
}).setLabel('Add comment type');

const searchBySummary = __custom(async () => {
	const map: StringMap = {["cf[10056]"]: "ELQ190112180035"};
	const resp = await JiraModule.getIssueByCustomField(baseProject.key, map);
	id = resp.issues[0].key;
	console.log(id)
}).setLabel('search by summary');

const editFixedVersions = __custom(async () => {
	const fixedVersions = {
		fixVersions:
			[
				{
					name: "V26-1"
				}
			],
	};
	const resp = await JiraModule.editIssue(id, fixedVersions);
	console.log(resp)
}).setLabel('edit an issue');

issueScenario.add(searchBySummary);
issueScenario.add(editFixedVersions);
// issueScenario.add(createIssue);
issueScenario.add(addComment);
// issueScenario.add(readIssue);
// issueScenario.add(attachFile);
// issueScenario.add(getIssueTypes);

