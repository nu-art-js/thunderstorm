/*
 * Firebase is a simpler Typescript wrapper to all of firebase services.
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

import {__scenario} from "@nu-art/testelot";
import {assert} from "@nu-art/ts-common";
import {
	testCollection,
	testInstance1,
	testInstance2,
	testInstance3,
	testInstance4,
	testInstance5,
	testNumber2,
	testString1,
	testString3,
	testString4
} from "../_core/consts";
import {FirestoreQuery} from "../../../_main";
import {
	FB_Type,
	Query_TestCase,
} from "../_core/types";

type QueryUnique_TestCase = Query_TestCase<FB_Type>

const allItems = [
	testInstance1,
	testInstance2,
	testInstance3,
	testInstance4,
	testInstance5
];

function queryUnique(label: string, expected: Partial<FB_Type>, query: FirestoreQuery<FB_Type>) {
	// const label1 = `${label}\\n - Query: ${JSON.stringify(query)}`;
	return testCollection.processDirty(label, async (collection) => {
		const item = await collection.queryUnique(query);
		assert("Objects do not match", expected, item);
	});
}


const queryTests: QueryUnique_TestCase[] = [
	{
		insert: allItems,
		label: "Unique Query - number",
		where: {numeric: testNumber2},
		expected: testInstance2
	},
	{
		label: "Unique Query - string",
		where: {stringValue: testString3},
		expected: testInstance3
	},
	{
		label: "Unique Query - boolean",
		where: {booleanValue: testInstance4.booleanValue},
		expected: testInstance4
	},
	{
		label: "Unique Query - boolean & string",
		where: {booleanValue: testInstance4.booleanValue, stringValue: testString4},
		expected: testInstance4
	},
	{
		insert: [testInstance1, testInstance1],
		label: "Query Limit 1",
		where: {stringValue: testString1},
		limit: 1,
		expected: testInstance1
	},
];

export const scenarioQueryUnique = __scenario("Query Unique");
for (const queryTest of queryTests) {
	const instances = queryTest.insert;
	if (instances)
		scenarioQueryUnique.add(testCollection.processClean("Populate db with items", async (collection) => {
			await collection.insertAll(instances);
		}));

	scenarioQueryUnique.add(queryUnique(queryTest.label, queryTest.expected, queryTest));
}
