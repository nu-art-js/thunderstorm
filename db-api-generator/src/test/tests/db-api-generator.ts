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

import {DB_Object} from "@nu-art/firebase";
import {
	assert,
	BadImplementationException,
	TypeValidator
} from "@nu-art/ts-common";
import {
	ServerApi
} from "@nu-art/thunderstorm/backend";
import {
	__custom,
	__scenario
} from "@nu-art/testelot";
import {
	BaseDB_ApiGenerator,
	tsValidateUniqueId
} from "../_main";
import {cleanup} from "./_core";


type ExampleDBType = DB_Object & {
	first: string;
	second: string;
	third: string;
};

const CollectionName_Examples = "examples";

export class ExampleModule_Class
	extends BaseDB_ApiGenerator<ExampleDBType> {
	static _validator: TypeValidator<ExampleDBType> = {
		_id: tsValidateUniqueId,
		first: undefined,
		second: undefined,
		third: undefined
	};

	constructor() {
		super(CollectionName_Examples, ExampleModule_Class._validator, "examples");
		this.setLockKeys(["second"]);
	}

	apis(pathPart?: string): ServerApi<any>[] {
		return [];
	}
}

export const ExampleModule = new ExampleModule_Class();

const exampleDocument1 = {
	first: "first",
	second: "second",
	third: "third"
};

export function patchTest() {
	const scenario = __scenario("BaseDB_ApiGenerator patch tests.");
	scenario.add(cleanup());
	scenario.add(__custom(async () => {
		const exampleDocument = await ExampleModule.upsert(exampleDocument1);
		const changedDocument = await ExampleModule.patch(
			{
				_id: exampleDocument._id,
				first: "first changed",
				second: "second changed",
				third: "third changed",
			});
		assert("Expecting second parameter doc to be unchanged", {
			_id: exampleDocument._id,
			first: "first changed",
			second: "second",
			third: "third changed",
		}, changedDocument);
	}).setLabel("Patching a document with unchanged second property."));
	scenario.add(__custom(async () => {
		const exampleDocument = await ExampleModule.upsert(exampleDocument1);
		const changedDocument = await ExampleModule.patch(
			{
				_id: exampleDocument._id,
				first: "first changed",
				second: "second changed",
				third: "third changed",
			}, ["first"]);
		assert("Expecting only first parameter to be changed", {
			_id: exampleDocument._id,
			first: "first changed",
			second: "second",
			third: "third",
		}, changedDocument);
	}).setLabel("Patching a document using propsToPatch parameter."));
	scenario.add(__custom(async () => {
		const exampleDocument = await ExampleModule.upsert(exampleDocument1);
		await ExampleModule.patch(
			{
				_id: exampleDocument._id,
				first: "first changed",
				second: "second changed",
				third: "third changed",
			}, ["first",
			    "second"]);
	}).expectToFail(
		BadImplementationException,(e: BadImplementationException) => e.message.startsWith(
			"Key second is part of the 'lockKeys' and cannot be updated."
		)
	).setLabel("Patching a document using invalid propsToPatch parameter."));
	scenario.add(cleanup());

	return scenario;
}

export function deleteTest() {
	const scenario = __scenario("BaseDB_ApiGenerator delete tests.");
	scenario.add(cleanup());
	scenario.add(__custom(async () => {
		const exampleDocument = await ExampleModule.upsert(exampleDocument1);
		const deletedDocument = await ExampleModule.deleteUnique(exampleDocument._id);
		assert("Expecting the inserted document to be deleted.", deletedDocument._id, exampleDocument._id);
	}).setLabel("Deleting a newly added document."));
	scenario.add(__custom(async () => {
		await ExampleModule.upsert(exampleDocument1);
		// @ts-ignore
		await ExampleModule.deleteUnique(undefined);
	}).expectToFail(
		BadImplementationException,(e: BadImplementationException) => e.message.startsWith(
			"No _id for deletion provided."
		)
	).setLabel("Calling deleteUnique() with undefined parameter."));
	scenario.add(cleanup());

	return scenario;
}
