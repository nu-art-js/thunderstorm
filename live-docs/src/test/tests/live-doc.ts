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
	__scenario,
	TestException
} from "@ir/testelot";
import {LiveDocsModule} from "../_main";
import {
	assert,
	auditBy,
	isErrorOfType
} from "@ir/ts-common";
import {cleanup} from "./_core";
import {ApiException} from "@ir/thunderstorm/backend";

export function getNoneExistingDoc() {
	const liveDocKey = "my-first-key";
	const scenario = __scenario("Get none existing doc");
	scenario.add(cleanup());
	scenario.add(__custom(async () => {
		const liveDoc = await LiveDocsModule.getLiveDoc(liveDocKey);
		assert("Expecting empty doc", {document: ""}, liveDoc)
	}));
	return scenario;
}

export function add_Get_Update_Undo_Redo_Doc() {
	const liveDocKey = "keyForDoc";
	const _auditBy = auditBy("testAgent");
	const document = "My very first liveDoc (well, not my very first indeed)";
	const documentUpdate = document + ". and now it's updated";
	const scenario = __scenario("Add, get, update, undo & redo updates in liveDoc");

	scenario.add(cleanup());
	scenario.add(__custom(async () => {
		await LiveDocsModule.updateLiveDoc(_auditBy, {document, key: liveDocKey});
	}).setLabel("Creating new liveDoc"));

	scenario.add(__custom(async () => {
		const liveDoc = await LiveDocsModule.getLiveDoc(liveDocKey);
		assert("Expecting original doc", {document, _audit: _auditBy}, liveDoc);
	}).setLabel("Getting the created liveDoc"));

	scenario.add(__custom(async () => {
		await LiveDocsModule.updateLiveDoc(_auditBy, {document: documentUpdate, key: liveDocKey});
	}).setLabel("Updating the liveDoc"));

	scenario.add(__custom(async () => {
		const liveDoc = await LiveDocsModule.getLiveDoc(liveDocKey);
		assert("Expecting updated doc", {document: documentUpdate, _audit: _auditBy}, liveDoc);
	}).setLabel("Getting the updated liveDoc"));

	scenario.add(__custom(async () => {
		await LiveDocsModule.changeHistory(_auditBy, liveDocKey, "undo");
	}).setLabel("undo update"));

	scenario.add(__custom(async () => {
		const liveDoc = await LiveDocsModule.getLiveDoc(liveDocKey);
		assert("Expecting undone doc", {document: document, _audit: _auditBy}, liveDoc);
	}).setLabel("Getting the undone liveDoc"));

	scenario.add(__custom(async () => {
		await LiveDocsModule.changeHistory(_auditBy, liveDocKey, "undo");
	}).expectToFail(ApiException, (e: ApiException) => e.responseCode === 402)
	  .setLabel("second undo, should fail"));

	scenario.add(__custom(async () => {
		await LiveDocsModule.changeHistory(_auditBy, liveDocKey, "redo");
	}).setLabel("redo update"));

	scenario.add(__custom(async () => {
		const liveDoc = await LiveDocsModule.getLiveDoc(liveDocKey);
		assert("Expecting re-done doc", {document: documentUpdate, _audit: _auditBy}, liveDoc);
	}).setLabel("Getting the re-done liveDoc"));

	scenario.add(__custom(async () => await LiveDocsModule.changeHistory(_auditBy, liveDocKey, "redo"))
		             .expectToFail(ApiException, (e: ApiException) => e.responseCode === 402)
		             .setLabel("second redo, should fail"));

	return scenario;
}
