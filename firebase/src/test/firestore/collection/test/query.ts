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
import {
	assert,
	sortArray
} from "@nu-art/ts-common";
import {
	testCollection,
	testInstance1,
	testInstance2,
	testInstance3,
	testInstance4,
	testInstance5,
	testItem1,
	testNumber2,
	testNumber3,
	testString1,
	testString2,
	testString4
} from "../_core/consts";
import {
	FB_Type,
	Query_TestCase
} from "../_core/types";

export type QueryGeneral_TestCase = Query_TestCase<FB_Type, FB_Type[]> & {
	invertSort?: boolean
}

const allItems = [
	testInstance1,
	testInstance2,
	testInstance3,
	testInstance4,
	testInstance5
];

const resultsSorter = (items: FB_Type[], invert: boolean = true) => sortArray(items, (item: FB_Type) => item.numeric, invert);

function query(label: string, expected: Partial<FB_Type>[], _query: QueryGeneral_TestCase, _resultsSorter?: (items: FB_Type[], invert: boolean) => FB_Type[]) {
	// const label1 = `${label}\n - Query: ${JSON.stringify(query)}`;
	return testCollection.processDirty(label, async (collection) => {
		let items = await collection.query(_query);
		items = _resultsSorter ? _resultsSorter(items, _query.invertSort === undefined) : items;
		assert("Objects do not match", expected, items);
	});
}

const queryTests: QueryGeneral_TestCase[] = [
	{
		insert: allItems,
		label: "Get all",
		where: {},
		expected: allItems
	},
	{
		label: "Query LESSER than..",
		where: {numeric: {"$lt": testNumber3}},
		expected: [testInstance1, testInstance2]
	},
	{
		label: "Query LESSER than or EQUALS to",
		where: {numeric: {"$lte": testNumber3}},
		expected: [testInstance1, testInstance2, testInstance3]
	},
	{
		label: "Query GREATER than..",
		where: {numeric: {"$gt": testNumber3}},
		expected: [testInstance4, testInstance5]
	},
	{
		label: "Query GREATER than or EQUALS to",
		where: {numeric: {"$gte": testNumber3}},
		expected: [testInstance3, testInstance4, testInstance5]
	},
	{
		label: "Query EQUALS to",
		where: {numeric: {"$eq": testNumber3}},
		expected: [testInstance3]
	},
	{
		label: "Query EQUALS to",
		where: {numeric: testNumber3},
		expected: [testInstance3]
	},
	{
		label: "Query IN number",
		where: {numeric: {"$in": [testNumber3, testNumber2]}},
		expected: [testInstance2, testInstance3]
	},
	{
		label: "Query IN string",
		where: {stringValue: {"$in": [testString4, testString2]}},
		expected: [testInstance2, testInstance4]
	},
	{
		label: "Query ARRAY CONTAINS ANY",
		where: {stringArray: {"$aca": [testString4]}},
		expected: [testInstance3, testInstance4, testInstance5]
	},
	{
		label: "Query ARRAY CONTAINS",
		where: {stringArray: {"$ac": testString4}},
		expected: [testInstance3, testInstance4, testInstance5]
	},
	{
		label: `Query ARRAY CONTAINS - Order "asc" by number`,
		where: {stringArray: {"$ac": testString4}},
		orderBy: [{key: "numeric", order: "asc"}],
		expected: [testInstance3, testInstance4, testInstance5]
	},
	{
		label: `Query ARRAY CONTAINS - Order "asc" by string`,
		where: {stringArray: {"$ac": testString4}},
		orderBy: [{key: "stringValue", order: "asc"}],
		expected: [testInstance3, testInstance4, testInstance5]
	},
	{
		label: `Query ARRAY CONTAINS - Order "desc" by number`,
		where: {stringArray: {"$ac": testString4}},
		orderBy: [{key: "numeric", order: "desc"}],
		invertSort: false,
		expected: [testInstance5, testInstance4, testInstance3]
	},
	{
		label: `Query ARRAY CONTAINS - Order "desc" by string`,
		where: {stringArray: {"$ac": testString4}},
		orderBy: [{key: "stringValue", order: "desc"}],
		invertSort: false,
		expected: [testInstance5, testInstance4, testInstance3]
	},
	{
		label: "Query SELECT string prop",
		where: {stringArray: {"$ac": testString4}},
		select: ["stringValue", "numeric"],
		expected: [
			{stringValue: testInstance3.stringValue, numeric: testInstance3.numeric},
			{stringValue: testInstance4.stringValue, numeric: testInstance4.numeric},
			{stringValue: testInstance5.stringValue, numeric: testInstance5.numeric}
		]
	},
	{
		insert: [testInstance1, testInstance1],
		label: "Query Limit 1",
		where: {stringValue: testString1},
		limit: 1,
		expected: [testInstance1]
	},
	{
		insert: [testInstance1, testInstance2],
		label: "Query array of objects",
		where: {objectArray: [{key: testItem1.key, value: testItem1.value}]},
		expected: [testInstance1, testInstance2]
	},
	{
		insert: [testInstance1, testInstance2],
		label: "Query nested object",
		where: {nestedObject: {one: testItem1}},
		expected: [testInstance1]
	}
];


export const scenarioQuery = __scenario("Query");
for (const queryTest of queryTests) {
	const instances = queryTest.insert;
	if (instances)
		scenarioQuery.add(testCollection.processClean(`Populate db with items - ${queryTest.label}`, async (collection) => {
			await collection.insertAll(instances);
		}));

	scenarioQuery.add(query(queryTest.label, queryTest.expected, queryTest, resultsSorter));
}


export const scenarioQueryNested = __scenario("Query Nested");
scenarioQueryNested.add(testCollection.processClean(`Populate db and query`, async (collection) => {
	const instances1 = {
		numeric: 1,
		stringValue: "string",
		booleanValue: true,
		stringArray: [],
		objectArray: [],
		nestedObject: {one: {key: "", value: 1}, two: {key: "", value: 5643524}}
	};
	const instances2 = {
		numeric: 1,
		stringValue: "string",
		booleanValue: true,
		stringArray: [],
		objectArray: [],
	};

	await collection.insertAll([instances1,instances2 ]);


	// @ts-ignore
	const res = await collection.query({where: {'nestedObject.one.value': 	{$gte: 1}	}})
	assert('No match',res[0],instances1)
}));
