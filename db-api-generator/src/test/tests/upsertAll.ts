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

import {DB_Object} from "@ir/firebase";
import {assert, generateHex} from "@ir/ts-common";
import {
	__custom,
	__scenario
} from "@ir/testelot";
import {cleanup} from "./_core";
import {ExampleModule} from "./db-api-generator";

const exampleDocument1 = {
	first: "first",
	second: "second",
	third: "third"
};
const exampleDocument2 = {
	_id: generateHex(32),
	first: "first2",
	second: "second2",
	third: "third2"
};
const exampleDocument3 = {
	first: "first3",
	second: "second3",
	third: "third3"
};

export function upsertAllTest() {
	const scenario = __scenario("UpsertAll");
	scenario.add(cleanup());
	scenario.add(__custom(async () => {
		const docs = new Array(10).fill(0).map(() => exampleDocument1);
		await ExampleModule.upsertAll(docs);

		assert("Expecting 10 docs in the db", (await ExampleModule.query({where: {}})).length, 10);
	}).setLabel("Upserting 10 docs"));

	scenario.add(cleanup());

	scenario.add(__custom(async () => {
		const docs = [exampleDocument1, exampleDocument2,exampleDocument3];
		const ret = await ExampleModule.upsertAll(docs);

		assert("Expecting the order of the passed elements to be maintained", ret[1], exampleDocument2);
	}).setLabel("Upserting ordered"));

	// scenario.add(cleanup());
	//
	// scenario.add(__custom(async () => {
	// 	const docs = new Array(10).fill(0).map(() => exampleDocument1);
	// 	await ExampleModule.upsertAll(docs);
	//
	// 	assert("Expecting 10 docs in the db", (await ExampleModule.query({where: {}})).length, 10);
	// }).setLabel("Upserting 10 docs"));

	return scenario;
}
